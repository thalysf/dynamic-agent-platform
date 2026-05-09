import os
from typing import Any

from groq import Groq

from app.schemas.orchestration import AgentPayload


def has_real_groq_key() -> bool:
    api_key = os.getenv("GROQ_API_KEY", "")
    return bool(api_key and api_key != "replace-me")


def configured_models(agent: AgentPayload) -> list[str]:
    primary = agent.modelName or os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    fallbacks = [
        model.strip()
        for model in os.getenv("GROQ_FALLBACK_MODELS", "llama-3.3-70b-versatile,llama-3.1-8b-instant").split(",")
        if model.strip()
    ]
    models: list[str] = []
    for model in [primary, *fallbacks]:
        if model not in models:
            models.append(model)
    return models


def generate_agent_output(
    agent: AgentPayload,
    user_input: str,
    context: dict[str, Any],
    tool_calls: list[dict[str, Any]],
) -> str:
    if not has_real_groq_key():
        return f"[{agent.name}] mock response for: {user_input}"

    client = Groq(api_key=os.environ["GROQ_API_KEY"], timeout=30.0)
    tool_context = "\n".join(str(call) for call in tool_calls) if tool_calls else "No tool calls."
    previous_outputs = context.get("previousOutputs", {})
    previous_context = "\n".join(f"{key}: {value}" for key, value in previous_outputs.items()) or "No previous outputs."

    last_error: Exception | None = None
    for model in configured_models(agent):
        try:
            response = client.chat.completions.create(
                model=model,
                temperature=agent.temperature,
                messages=[
                    {"role": "system", "content": agent.systemPrompt},
                    {
                        "role": "user",
                        "content": (
                            f"Initial/current input:\n{user_input}\n\n"
                            f"Previous outputs:\n{previous_context}\n\n"
                            f"Allowed tool results:\n{tool_context}"
                        ),
                    },
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as exception:
            last_error = exception

    raise RuntimeError("Groq request failed for all configured models.") from last_error


def configured_summary_models() -> list[str]:
    primary = os.getenv("GROQ_SUMMARY_MODEL") or os.getenv(
        "GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"
    )
    fallbacks = [
        model.strip()
        for model in os.getenv("GROQ_FALLBACK_MODELS", "llama-3.3-70b-versatile,llama-3.1-8b-instant").split(",")
        if model.strip()
    ]
    models: list[str] = []
    for model in [primary, *fallbacks]:
        if model and model not in models:
            models.append(model)
    return models


def summarize_execution_output(initial_input: str, steps: list[dict[str, Any]], terminal_output: str) -> str:
    if not steps:
        return fallback_execution_summary(initial_input, steps, terminal_output)

    if not has_real_groq_key():
        return fallback_execution_summary(initial_input, steps, terminal_output)

    prompt_context = execution_summary_context(initial_input, steps, terminal_output)
    client = Groq(api_key=os.environ["GROQ_API_KEY"], timeout=30.0)
    last_error: Exception | None = None

    for model in configured_summary_models():
        try:
            response = client.chat.completions.create(
                model=model,
                temperature=0.2,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Voce e um agente oculto de sintese de execucoes. "
                            "Resuma em portugues, de forma curta e objetiva, o que a pipeline fez, "
                            "quais steps falharam e qual resultado util ficou disponivel. "
                            "Nao concatene outputs brutos."
                        ),
                    },
                    {"role": "user", "content": prompt_context},
                ],
            )
            summary = (response.choices[0].message.content or "").strip()
            if summary:
                return summary
        except Exception as exception:
            last_error = exception

    fallback = fallback_execution_summary(initial_input, steps, terminal_output)
    if last_error:
        return f"{fallback}\n\nResumo por IA indisponivel: {last_error}"
    return fallback


def execution_summary_context(initial_input: str, steps: list[dict[str, Any]], terminal_output: str) -> str:
    compact_steps = "\n\n".join(compact_step_for_summary(step) for step in steps)
    return (
        f"Input inicial:\n{limit_text(initial_input, 900)}\n\n"
        f"Steps:\n{compact_steps}\n\n"
        f"Resultado terminal bruto:\n{limit_text(terminal_output, 1200)}"
    )


def compact_step_for_summary(step: dict[str, Any]) -> str:
    tool_calls = step.get("toolCalls") or []
    tool_summary = "; ".join(compact_tool_call(call) for call in tool_calls) if tool_calls else "sem tools"
    return (
        f"Step {step.get('index')} - {step.get('agentName') or step.get('agentId')} "
        f"({step.get('status')}):\n"
        f"Input: {limit_text(str(step.get('input') or ''), 420)}\n"
        f"Output: {limit_text(str(step.get('output') or ''), 650)}\n"
        f"Tools: {limit_text(tool_summary, 650)}\n"
        f"Erro: {step.get('errorMessage') or 'nenhum'}"
    )


def compact_tool_call(call: dict[str, Any]) -> str:
    result = call.get("result") if isinstance(call.get("result"), dict) else {}
    result_parts = []
    for key in ("path", "publicUrl", "mimeType", "bytesRead", "bytesWritten", "query", "source"):
        value = result.get(key)
        if value not in (None, ""):
            result_parts.append(f"{key}={value}")
    error = call.get("error")
    if error:
        result_parts.append(f"error={error}")
    detail = ", ".join(result_parts) if result_parts else "sem detalhe"
    return f"{call.get('toolName')} {call.get('status')}: {detail}"


def fallback_execution_summary(initial_input: str, steps: list[dict[str, Any]], terminal_output: str) -> str:
    total = len(steps)
    failed_steps = [step for step in steps if step.get("status") == "FAILED"]
    completed_count = total - len(failed_steps)
    result_preview = limit_text(terminal_output, 900).strip()
    if failed_steps:
        failures = "; ".join(
            f"Step {step.get('index')} ({step.get('agentName') or step.get('agentId')}): "
            f"{step.get('errorMessage') or 'falha sem detalhe'}"
            for step in failed_steps[:4]
        )
        return (
            f"Execucao parcial: {completed_count} de {total} steps concluiram. "
            f"Falhas: {failures}. "
            f"Resultado util disponivel: {result_preview or 'sem resultado final.'}"
        )
    return (
        f"Execucao concluida: {total} step{'s' if total != 1 else ''} processado"
        f"{'s' if total != 1 else ''}. "
        f"Resultado util: {result_preview or limit_text(initial_input, 500) or 'sem output final.'}"
    )


def limit_text(value: str, max_chars: int) -> str:
    normalized = " ".join(value.split())
    if len(normalized) <= max_chars:
        return normalized
    return f"{normalized[: max_chars - 3].rstrip()}..."
