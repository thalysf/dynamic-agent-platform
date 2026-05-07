from app.graph.pipeline_graph import execute_pipeline_graph
from app.schemas.orchestration import OrchestrationRunRequest, OrchestrationRunResponse


def run_mock_orchestration(request: OrchestrationRunRequest) -> OrchestrationRunResponse:
    try:
        result = execute_pipeline_graph(request)
        return OrchestrationRunResponse(
            executionId=request.executionId,
            status="COMPLETED",
            finalOutput=result["final_output"],
            steps=result["steps"],
        )
    except Exception as exc:
        return OrchestrationRunResponse(
            executionId=request.executionId,
            status="FAILED",
            finalOutput=str(exc),
            steps=[],
        )
