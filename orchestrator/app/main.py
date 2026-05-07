from fastapi import FastAPI

from app.schemas.health import HealthResponse
from app.schemas.orchestration import OrchestrationRunRequest, OrchestrationRunResponse
from app.services.mock_orchestrator import run_mock_orchestration

app = FastAPI(title="AgentFlow Orchestrator", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="UP", service="agentflow-orchestrator")


@app.post("/orchestrations/run", response_model=OrchestrationRunResponse)
def run_orchestration(request: OrchestrationRunRequest) -> OrchestrationRunResponse:
    return run_mock_orchestration(request)
