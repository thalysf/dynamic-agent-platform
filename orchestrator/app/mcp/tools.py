import base64
import difflib
import html
import json
import mimetypes
import os
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
import urllib.parse
import urllib.request
import urllib.error


ToolHandler = Callable[[str, dict[str, Any]], dict[str, Any]]

DEFAULT_HF_IMAGE_PROVIDER = "wavespeed"
DEFAULT_HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-dev"
DEFAULT_HF_IMAGE_FALLBACKS = (
    ("together", "black-forest-labs/FLUX.1-schnell"),
    ("hf-inference", "black-forest-labs/FLUX.1-schnell"),
    ("hf-inference", "stabilityai/stable-diffusion-3-medium-diffusers"),
)


class ToolExecutionError(ValueError):
    pass


@dataclass(frozen=True)
class ToolSpec:
    name: str
    handler: ToolHandler


@dataclass(frozen=True)
class ImageModelCandidate:
    provider: str
    model: str


def word_count_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    return {"wordCount": len(content.split())}


def echo_context_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    return {"previousOutputKeys": list(context.get("previousOutputs", {}).keys())}


def file_write_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    payload = extract_tool_payload(content, "file_write")
    path = optional_string(payload, "path") or default_text_path(content, payload, context)
    target = resolve_tool_path(path)
    overwrite = bool(payload.get("overwrite", False))

    if target.exists() and not overwrite:
        raise ToolExecutionError(f"File already exists: {path}. Set overwrite=true to replace it.")

    target.parent.mkdir(parents=True, exist_ok=True)
    existed_before = target.exists()
    if "contentBase64" in payload:
        raw_content = required_string(payload, "contentBase64")
        data = base64.b64decode(raw_content.encode("ascii"), validate=True)
        target.write_bytes(data)
        binary = True
        bytes_written = len(data)
    elif "content" in payload:
        encoding = str(payload.get("encoding") or "utf-8")
        text_content = str(payload["content"])
        target.write_text(text_content, encoding=encoding)
        binary = False
        bytes_written = len(text_content.encode(encoding))
    else:
        encoding = str(payload.get("encoding") or "utf-8")
        text_content = content.strip()
        if not text_content:
            raise ToolExecutionError("file_write requires content, contentBase64, or non-empty input text.")
        target.write_text(text_content, encoding=encoding)
        binary = False
        bytes_written = len(text_content.encode(encoding))

    return {
        "path": path,
        "absolutePath": str(target),
        "publicUrl": public_tool_url(path),
        "created": not existed_before,
        "bytesWritten": bytes_written,
        "binary": binary,
    }


def file_read_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    payload = extract_tool_payload(content, "file_read")
    requested_path = (
        optional_string(payload, "path")
        or optional_string(payload, "file")
        or optional_string(payload, "filename")
        or optional_string(payload, "query")
    )
    max_bytes = positive_int(payload.get("maxBytes"), env_int("AGENTFLOW_TOOL_MAX_READ_BYTES", 65536))

    target: Path | None = None
    if requested_path:
        target = resolve_tool_path(requested_path)
        if not target.exists() or not target.is_file():
            target = find_matching_workspace_file(requested_path)
    else:
        target = find_matching_workspace_file(content)

    if target is None:
        raise ToolExecutionError("No matching file was found in AGENTFLOW_TOOL_WORKDIR.")

    root = tool_workspace_root()
    path = target.relative_to(root).as_posix()
    if not target.exists() or not target.is_file():
        raise ToolExecutionError(f"File not found: {path}.")

    data = target.read_bytes()
    if len(data) > max_bytes:
        raise ToolExecutionError(f"File {path} has {len(data)} bytes and exceeds maxBytes={max_bytes}.")

    encoding = str(payload.get("encoding") or "utf-8")
    mime_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    try:
        text = data.decode(encoding)
        return {
            "path": path,
            "absolutePath": str(target),
            "publicUrl": public_tool_url(path),
            "mimeType": mime_type,
            "bytesRead": len(data),
            "content": text,
        }
    except UnicodeDecodeError:
        return {
            "path": path,
            "absolutePath": str(target),
            "publicUrl": public_tool_url(path),
            "mimeType": mime_type,
            "bytesRead": len(data),
            "contentBase64": base64.b64encode(data).decode("ascii"),
        }


def web_search_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    payload = extract_tool_payload(content, "web_search")
    query = str(payload.get("query") or content).strip()
    if not query:
        raise ToolExecutionError("web_search requires a query.")

    max_results = min(positive_int(payload.get("maxResults"), 3), 5)
    errors: list[str] = []
    for source_name, searcher in (
        ("duckduckgo_instant_answer", search_duckduckgo_instant),
        ("duckduckgo_html", search_duckduckgo_html),
        ("wikipedia_opensearch", search_wikipedia),
    ):
        try:
            results = searcher(query, max_results)
            if results:
                return {"query": query, "source": source_name, "results": results[:max_results]}
            errors.append(f"{source_name}: no results")
        except Exception as exc:
            errors.append(f"{source_name}: {exc}")

    raise ToolExecutionError("web_search found no results. " + " | ".join(errors))


def search_duckduckgo_instant(query: str, max_results: int) -> list[dict[str, str]]:
    timeout = float(os.getenv("WEB_SEARCH_TIMEOUT_SECONDS", "8"))
    url = "https://api.duckduckgo.com/?" + urllib.parse.urlencode(
        {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1",
        }
    )
    text = http_get_text(url, timeout)
    payload = json.loads(text)
    return duckduckgo_results(payload, max_results)


def search_duckduckgo_html(query: str, max_results: int) -> list[dict[str, str]]:
    timeout = float(os.getenv("WEB_SEARCH_TIMEOUT_SECONDS", "8"))
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    text = http_get_text(url, timeout)
    results: list[dict[str, str]] = []
    pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>.*?'
        r'<a[^>]+class="result__snippet"[^>]*>(?P<snippet>.*?)</a>',
        re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.finditer(text):
        href = clean_duckduckgo_url(html.unescape(match.group("href")))
        title = clean_html(match.group("title"))
        snippet = clean_html(match.group("snippet"))
        if title and href:
            results.append({"title": title, "url": href, "snippet": snippet})
        if len(results) >= max_results:
            break
    return results


def search_wikipedia(query: str, max_results: int) -> list[dict[str, str]]:
    timeout = float(os.getenv("WEB_SEARCH_TIMEOUT_SECONDS", "8"))
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "opensearch",
            "search": query,
            "limit": max_results,
            "namespace": "0",
            "format": "json",
        }
    )
    payload = json.loads(http_get_text(url, timeout))
    if not isinstance(payload, list) or len(payload) < 4:
        return []
    titles = payload[1] if isinstance(payload[1], list) else []
    snippets = payload[2] if isinstance(payload[2], list) else []
    urls = payload[3] if isinstance(payload[3], list) else []
    results: list[dict[str, str]] = []
    for index, title in enumerate(titles[:max_results]):
        results.append(
            {
                "title": str(title),
                "url": str(urls[index]) if index < len(urls) else "",
                "snippet": str(snippets[index]) if index < len(snippets) else "",
            }
        )
    return results


def http_get_text(url: str, timeout: float) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
            "User-Agent": "AgentFlowStudio/0.1 (+https://localhost)",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def image_generate_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    payload = extract_tool_payload(content, "image_generate")
    prompt = image_prompt(payload, content)
    if not prompt:
        raise ToolExecutionError("image_generate requires a prompt.")

    api_key = os.getenv("HF_TOKEN", "").strip()
    if not api_key or api_key == "replace-me":
        raise ToolExecutionError("HF_TOKEN is not configured.")

    provider = optional_string(payload, "provider") or os.getenv("HF_IMAGE_PROVIDER", DEFAULT_HF_IMAGE_PROVIDER).strip()
    model = optional_string(payload, "model") or os.getenv("HF_IMAGE_MODEL", DEFAULT_HF_IMAGE_MODEL).strip()
    if not provider:
        provider = DEFAULT_HF_IMAGE_PROVIDER
    if not model:
        model = DEFAULT_HF_IMAGE_MODEL

    output_path = str(payload.get("path") or default_image_path())
    target = resolve_tool_path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    candidates = image_model_candidates(ImageModelCandidate(provider=provider, model=model))
    image, selected_candidate, attempts = generate_huggingface_image_with_fallbacks(candidates, api_key, prompt)
    image.save(target, format=image_save_format(target))
    mime_type = mimetypes.guess_type(target.name)[0] or "image/png"

    return {
        "path": output_path,
        "absolutePath": str(target),
        "publicUrl": public_tool_url(output_path),
        "provider": selected_candidate.provider,
        "model": selected_candidate.model,
        "attempts": attempts,
        "mimeType": mime_type,
        "bytesWritten": target.stat().st_size,
    }


TOOL_REGISTRY: dict[str, ToolSpec] = {
    "word_count": ToolSpec("word_count", word_count_tool),
    "echo_context": ToolSpec("echo_context", echo_context_tool),
    "file_write": ToolSpec("file_write", file_write_tool),
    "file_read": ToolSpec("file_read", file_read_tool),
    "web_search": ToolSpec("web_search", web_search_tool),
    "image_generate": ToolSpec("image_generate", image_generate_tool),
}


def run_allowed_tools(allowed_tools: set[str], content: str, context: dict[str, Any]) -> list[dict[str, Any]]:
    tool_calls: list[dict[str, Any]] = []
    for tool_name, spec in TOOL_REGISTRY.items():
        if tool_name not in allowed_tools:
            continue
        try:
            tool_calls.append(
                {
                    "toolName": tool_name,
                    "status": "COMPLETED",
                    "result": spec.handler(content, context),
                }
            )
        except Exception as exc:
            tool_calls.append(
                {
                    "toolName": tool_name,
                    "status": "FAILED",
                    "error": str(exc),
                }
            )
    return tool_calls


def extract_tool_payload(content: str, tool_name: str) -> dict[str, Any]:
    parsed = parse_json_object(content)
    if not parsed:
        return {}

    nested_tools = parsed.get("tools")
    if isinstance(nested_tools, dict) and isinstance(nested_tools.get(tool_name), dict):
        return nested_tools[tool_name]

    direct_tool = parsed.get(tool_name)
    if isinstance(direct_tool, dict):
        return direct_tool

    if parsed.get("tool") == tool_name:
        return {key: value for key, value in parsed.items() if key != "tool"}

    return parsed


def parse_json_object(content: str) -> dict[str, Any]:
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def required_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ToolExecutionError(f"Missing required string field: {key}.")
    return value.strip()


def optional_string(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def positive_int(value: Any, default: int) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default


def generate_huggingface_image(provider: str, api_key: str, model: str, prompt: str) -> Any:
    from huggingface_hub import InferenceClient

    client = InferenceClient(provider=provider, api_key=api_key)
    return client.text_to_image(prompt, model=model)


def generate_huggingface_image_with_fallbacks(
    candidates: list[ImageModelCandidate], api_key: str, prompt: str
) -> tuple[Any, ImageModelCandidate, list[dict[str, str]]]:
    attempts: list[dict[str, str]] = []
    for candidate in candidates:
        try:
            image = generate_huggingface_image(candidate.provider, api_key, candidate.model, prompt)
            attempts.append(
                {
                    "provider": candidate.provider,
                    "model": candidate.model,
                    "status": "COMPLETED",
                }
            )
            return image, candidate, attempts
        except Exception as exc:
            attempts.append(
                {
                    "provider": candidate.provider,
                    "model": candidate.model,
                    "status": "FAILED",
                    "error": sanitized_provider_error(exc, api_key),
                }
            )

    errors = " | ".join(
        f"{attempt['provider']}:{attempt['model']} -> {attempt.get('error', 'failed')}" for attempt in attempts
    )
    raise ToolExecutionError(f"Hugging Face image generation failed for all configured models. {errors}")


def image_model_candidates(primary: ImageModelCandidate) -> list[ImageModelCandidate]:
    candidates = [primary]
    candidates.extend(parse_image_fallbacks(os.getenv("HF_IMAGE_FALLBACKS", "")))
    candidates.extend(ImageModelCandidate(provider=provider, model=model) for provider, model in DEFAULT_HF_IMAGE_FALLBACKS)

    unique: list[ImageModelCandidate] = []
    seen: set[tuple[str, str]] = set()
    for candidate in candidates:
        provider = candidate.provider.strip()
        model = candidate.model.strip()
        if not provider or not model:
            continue
        key = (provider, model)
        if key in seen:
            continue
        seen.add(key)
        unique.append(ImageModelCandidate(provider=provider, model=model))
    return unique


def parse_image_fallbacks(raw_value: str) -> list[ImageModelCandidate]:
    candidates: list[ImageModelCandidate] = []
    for item in raw_value.split(","):
        entry = item.strip()
        if not entry:
            continue
        if "|" not in entry:
            continue
        provider, model = entry.split("|", 1)
        if provider.strip() and model.strip():
            candidates.append(ImageModelCandidate(provider=provider.strip(), model=model.strip()))
    return candidates


def sanitized_provider_error(exc: Exception, api_key: str) -> str:
    text = str(exc)
    if api_key:
        text = text.replace(api_key, "[HF_TOKEN]")
    return re.sub(r"\s+", " ", text).strip()[:400]


def image_save_format(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "JPEG"
    if suffix == ".webp":
        return "WEBP"
    return "PNG"


def tool_workspace_root() -> Path:
    configured = os.getenv("AGENTFLOW_TOOL_WORKDIR", "tool-workspace")
    root = Path(configured).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve_tool_path(path: str) -> Path:
    root = tool_workspace_root()
    requested_path = Path(path).expanduser()
    target = requested_path.resolve() if requested_path.is_absolute() else (root / requested_path).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise ToolExecutionError("Tool file path escapes AGENTFLOW_TOOL_WORKDIR.") from exc
    return target


def public_tool_url(path: str) -> str:
    base_url = os.getenv("ORCHESTRATOR_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
    normalized = path.replace("\\", "/").lstrip("/")
    return f"{base_url}/tool-files/{urllib.parse.quote(normalized, safe='/')}"


def duckduckgo_results(payload: dict[str, Any], max_results: int) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    abstract = str(payload.get("AbstractText") or "").strip()
    if abstract:
        results.append(
            {
                "title": str(payload.get("Heading") or "DuckDuckGo result"),
                "url": str(payload.get("AbstractURL") or ""),
                "snippet": abstract,
            }
        )

    collect_related_topics(payload.get("RelatedTopics", []), results, max_results)
    return results[:max_results]


def collect_related_topics(topics: Any, results: list[dict[str, str]], max_results: int) -> None:
    if not isinstance(topics, list):
        return
    for topic in topics:
        if len(results) >= max_results:
            return
        if not isinstance(topic, dict):
            continue
        if isinstance(topic.get("Topics"), list):
            collect_related_topics(topic["Topics"], results, max_results)
            continue
        text = str(topic.get("Text") or "").strip()
        if text:
            results.append(
                {
                    "title": text.split(" - ", 1)[0][:120],
                    "url": str(topic.get("FirstURL") or ""),
                    "snippet": text,
                }
            )


def clean_duckduckgo_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    query_params = urllib.parse.parse_qs(parsed.query)
    if "uddg" in query_params and query_params["uddg"]:
        return query_params["uddg"][0]
    return url


def clean_html(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(without_tags)).strip()


def find_matching_workspace_file(query: str) -> Path | None:
    root = tool_workspace_root()
    files = [path for path in root.rglob("*") if path.is_file()]
    if not files:
        return None

    candidates = explicit_file_candidates(query)
    for candidate in candidates:
        try:
            direct = resolve_tool_path(candidate)
        except ToolExecutionError:
            direct = None
        if direct is not None and direct.exists() and direct.is_file():
            return direct

    search_text = file_search_text(query, candidates)
    normalized_query = normalize_for_match(search_text)
    if not normalized_query:
        return None

    scored: list[tuple[float, Path]] = []
    query_terms = meaningful_match_terms(normalized_query)
    if not query_terms:
        query_terms = set(normalized_query.split())
    for file_path in files[: env_int("AGENTFLOW_TOOL_MAX_SEARCH_FILES", 2000)]:
        relative = file_path.relative_to(root).as_posix()
        normalized_file = normalize_for_match(f"{relative} {file_path.stem}")
        filename_terms = meaningful_match_terms(normalized_file)
        name_overlap = len(query_terms & filename_terms) / max(1, len(query_terms))
        ratio = difflib.SequenceMatcher(None, normalized_query, normalized_file).ratio()
        name_contains_bonus = 0.45 if normalized_query in normalized_file else 0
        term_contains_bonus = 0.12 if any(term in normalized_file for term in query_terms) else 0
        score = max(name_overlap + name_contains_bonus + term_contains_bonus, ratio * 0.85)
        scored.append((score, file_path))

    best_score, best_path = max(scored, key=lambda item: item[0])
    return best_path if best_score >= 0.32 else None


def file_search_text(query: str, candidates: list[str]) -> str:
    without_code = re.sub(r"```.*?```", " ", query, flags=re.DOTALL)
    lines = [line.strip() for line in without_code.splitlines() if line.strip()]
    natural_text = " ".join(lines[:8])[:900]
    if candidates:
        return " ".join([*candidates, natural_text])
    return natural_text


STOPWORDS = {
    "a",
    "ao",
    "aos",
    "algum",
    "alguma",
    "as",
    "arquivo",
    "arquivos",
    "com",
    "como",
    "conteudo",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "essa",
    "esse",
    "esta",
    "este",
    "file",
    "ler",
    "leia",
    "nome",
    "o",
    "os",
    "para",
    "por",
    "que",
    "read",
    "relacionada",
    "relacionado",
    "sobre",
    "the",
    "um",
    "uma",
}


def meaningful_match_terms(normalized_value: str) -> set[str]:
    return {term for term in normalized_value.split() if len(term) >= 3 and term not in STOPWORDS}


def explicit_file_candidates(content: str) -> list[str]:
    candidates: list[str] = []
    candidates.extend(match.strip() for match in re.findall(r'["`]([^"`]+?\.[A-Za-z0-9]{1,8})["`]', content))
    candidates.extend(match.strip() for match in re.findall(r"([\w .\-/\\]+?\.[A-Za-z0-9]{1,8})", content))
    candidates.extend(
        match.strip()
        for match in re.findall(
            r"(?:arquivo|file|path|caminho|nome)\s*(?:chamado|nomeado|=|:)?\s*([A-Za-z0-9 _.\-/\\]+)",
            content,
            flags=re.IGNORECASE,
        )
    )
    unique: list[str] = []
    for candidate in candidates:
        cleaned = candidate.strip(" .,:;()[]{}")
        if cleaned and cleaned not in unique:
            unique.append(cleaned)
    return unique


def normalize_for_match(value: str) -> str:
    without_accents = "".join(
        char for char in unicodedata.normalize("NFKD", value.lower()) if not unicodedata.combining(char)
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", without_accents)).strip()


def default_image_path() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return f"agentflow-image-{stamp}.png"


def default_text_path(content: str, payload: dict[str, Any], context: dict[str, Any]) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")
    seed_parts = [
        optional_string(payload, "filename"),
        optional_string(payload, "name"),
        optional_string(payload, "title"),
        optional_string(payload, "topic"),
        optional_string(payload, "content"),
        content,
        str(context.get("initialInput") or ""),
        " ".join(str(value) for value in context.get("previousOutputs", {}).values()),
    ]
    slug = contextual_slug(" ".join(part for part in seed_parts if part))
    return f"{slug}-{stamp}.txt"


def contextual_slug(value: str) -> str:
    without_code = re.sub(r"```.*?```", " ", value, flags=re.DOTALL)
    normalized = normalize_for_match(without_code)
    terms = [term for term in normalized.split() if len(term) >= 3 and term not in STOPWORDS]
    if not terms:
        return "agentflow-output"
    unique_terms: list[str] = []
    for term in terms:
        if term not in unique_terms:
            unique_terms.append(term)
        if len(unique_terms) >= 7:
            break
    return "-".join(unique_terms) or "agentflow-output"


def image_prompt(payload: dict[str, Any], content: str) -> str:
    explicit_prompt = optional_string(payload, "prompt")
    if explicit_prompt:
        return explicit_prompt

    matches = re.findall(r"prompt[^:\n]*:\s*[*_`]*\s*[\"']?([^\"'\n]+)", content, flags=re.IGNORECASE)
    if matches:
        return matches[-1].strip()

    return content.strip()
