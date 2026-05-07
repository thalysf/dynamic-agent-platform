from app.schemas.orchestration import (
    OrchestrationRunRequest,
    OrchestrationRunResponse,
    OrchestrationStep,
)


def run_mock_orchestration(request: OrchestrationRunRequest) -> OrchestrationRunResponse:
    current_input = request.initialInput.content
    steps: list[OrchestrationStep] = []

    selected_agents = request.agents
    if not selected_agents:
        final_output = f"Mock execution completed without agents. Input: {current_input}"
        return OrchestrationRunResponse(
            executionId=request.executionId,
            status="COMPLETED",
            finalOutput=final_output,
            steps=[],
        )

    for index, agent in enumerate(selected_agents, start=1):
        output = f"[{agent.name}] mock response for: {current_input}"
        steps.append(
            OrchestrationStep(
                index=index,
                agentId=agent.id,
                agentName=agent.name,
                status="COMPLETED",
                input=current_input,
                output=output,
            )
        )
        current_input = output

    return OrchestrationRunResponse(
        executionId=request.executionId,
        status="COMPLETED",
        finalOutput=current_input,
        steps=steps,
    )
