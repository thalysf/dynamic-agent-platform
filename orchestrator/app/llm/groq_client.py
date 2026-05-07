import os
from typing import Any

from groq import Groq

from app.schemas.orchestration import AgentPayload


def has_real_groq_key() -> bool:
    api_key = os.getenv("GROQ_API_KEY", "")
    return bool(api_key and api_key != "replace-me")


def generate_agent_output(
    agent: AgentPayload,
    user_input: str,
    context: dict[str, Any],
    tool_calls: list[dict[str, Any]],
) -> str:
    if not has_real_groq_key():
        return f"[{agent.name}] mock response for: {user_input}"

    client = Groq(api_key=os.environ["GROQ_API_KEY"], timeout=30.0)
    model = agent.modelName or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    tool_context = "\n".join(str(call) for call in tool_calls) if tool_calls else "No tool calls."
    previous_outputs = context.get("previousOutputs", {})
    previous_context = "\n".join(f"{key}: {value}" for key, value in previous_outputs.items()) or "No previous outputs."

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
