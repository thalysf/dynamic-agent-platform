from typing import Any, Callable


ToolHandler = Callable[[str, dict[str, Any]], dict[str, Any]]


def word_count_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    return {"wordCount": len(content.split())}


def echo_context_tool(content: str, context: dict[str, Any]) -> dict[str, Any]:
    return {"previousOutputKeys": list(context.get("previousOutputs", {}).keys())}


TOOL_REGISTRY: dict[str, ToolHandler] = {
    "word_count": word_count_tool,
    "echo_context": echo_context_tool,
}


def run_allowed_tools(allowed_tools: set[str], content: str, context: dict[str, Any]) -> list[dict[str, Any]]:
    tool_calls: list[dict[str, Any]] = []
    for tool_name in sorted(allowed_tools):
        handler = TOOL_REGISTRY.get(tool_name)
        if handler is None:
            continue
        try:
            tool_calls.append(
                {
                    "toolName": tool_name,
                    "status": "COMPLETED",
                    "result": handler(content, context),
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
