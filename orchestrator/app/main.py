from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from app.mcp.tools import resolve_tool_path
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


@app.get("/tool-files/{file_path:path}")
def get_tool_file(file_path: str) -> FileResponse:
    target = resolve_tool_path(file_path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Tool file not found.")
    return FileResponse(target)
