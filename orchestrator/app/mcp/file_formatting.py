import re
from pathlib import Path


VOID_HTML_TAGS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}


def format_file_content_for_path(content: str, target: Path) -> str:
    if target.suffix.lower() in {".html", ".htm"}:
        return format_html_document(content)
    return content


def format_html_document(content: str) -> str:
    stripped = content.strip()
    if "\n" in stripped and len(stripped.splitlines()) > 4:
        return content

    raw_blocks: list[str] = []

    def replace_raw_block(match: re.Match[str]) -> str:
        raw_blocks.append(match.group(0))
        return f"___AGENTFLOW_RAW_HTML_BLOCK_{len(raw_blocks) - 1}___"

    safe_html = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        replace_raw_block,
        stripped,
        flags=re.IGNORECASE | re.DOTALL,
    )
    tokens = re.split(r"(<[^>]+>)", safe_html)
    lines: list[str] = []
    indent = 0

    for token in tokens:
        if not token:
            continue
        is_tag = token.startswith("<") and token.endswith(">")
        if not is_tag:
            text = token.strip()
            raw_match = re.fullmatch(r"___AGENTFLOW_RAW_HTML_BLOCK_(\d+)___", text)
            if raw_match:
                lines.extend(format_raw_html_block(raw_blocks[int(raw_match.group(1))], indent))
            elif text:
                lines.append(f"{'  ' * indent}{text}")
            continue

        tag_name = html_tag_name(token)
        is_closing = token.startswith("</")
        is_void = tag_name in VOID_HTML_TAGS or token.endswith("/>")
        if is_closing:
            indent = max(0, indent - 1)

        lines.append(f"{'  ' * indent}{token.strip()}")

        if not is_closing and not is_void and not token.startswith("<!"):
            indent += 1

    return "\n".join(lines).strip() + "\n"


def html_tag_name(tag: str) -> str:
    match = re.match(r"</?\s*([a-zA-Z0-9:-]+)", tag)
    return match.group(1).lower() if match else ""


def format_raw_html_block(block: str, indent: int) -> list[str]:
    match = re.match(r"(<(script|style)\b[^>]*>)(.*)(</\2>)", block, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return [f"{'  ' * indent}{block.strip()}"]
    start_tag = match.group(1).strip()
    body = match.group(3).strip()
    end_tag = match.group(4).strip()
    lines = [f"{'  ' * indent}{start_tag}"]
    if body:
        lines.append(f"{'  ' * (indent + 1)}{body}")
    lines.append(f"{'  ' * indent}{end_tag}")
    return lines
