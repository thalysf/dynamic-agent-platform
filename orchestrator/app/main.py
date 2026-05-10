import os
import json
import shutil
import subprocess
import time
import urllib.error
import urllib.request

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.mcp.tools import resolve_tool_path
from app.schemas.health import HealthResponse
from app.schemas.orchestration import OrchestrationRunRequest, OrchestrationRunResponse
from app.services.mock_orchestrator import run_mock_orchestration

app = FastAPI(title="AgentFlow Orchestrator", version="0.1.0")
RUNNABLE_BACKEND_PREFIX = "demo-issue-triage/backend/"
BACKEND_RUN_PORT = 3000
backend_processes: dict[str, subprocess.Popen] = {}


class BackendRunRequest(BaseModel):
    path: str = Field(min_length=1)


class BackendRunResponse(BaseModel):
    status: str
    path: str
    url: str
    triageUrl: str
    message: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


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


@app.post("/tool-files/backend-runs", response_model=BackendRunResponse)
def run_backend_file(request: BackendRunRequest) -> BackendRunResponse:
    path = normalized_backend_path(request.path)
    target = resolve_tool_path(path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de backend nao encontrado.")

    runtime = shutil.which("npx")
    node = shutil.which("node")
    if not runtime or not node:
        raise HTTPException(
            status_code=424,
            detail=(
                "Seu sistema nao atende aos requisitos para executar este backend. "
                "Instale Node.js, npm e as dependencias do projeto, ou recrie o container do orchestrator."
            ),
        )

    existing = backend_processes.get(path)
    if existing and existing.poll() is None:
        stop_backend_process(existing)

    env = os.environ.copy()
    env["PORT"] = str(BACKEND_RUN_PORT)
    env["NODE_PATH"] = "/app/node_modules"
    process = subprocess.Popen(
        [runtime, "tsx", str(target)],
        cwd="/app",
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    backend_processes[path] = process
    time.sleep(1.2)
    if process.poll() is not None:
        stdout, stderr = process.communicate(timeout=1)
        error_output = (stderr or stdout or "processo finalizado sem detalhes").strip()
        raise HTTPException(
            status_code=500,
            detail=(
                "Seu sistema nao conseguiu executar este backend. "
                "Verifique se o arquivo compila, se a porta 3000 esta livre e se Node.js/npm estao instalados. "
                f"Detalhe: {error_output[:700]}"
            ),
        )

    return backend_run_response(path, "RUNNING", "Backend iniciado na porta 3000.")


@app.get("/demo-backend/health")
def proxy_backend_health() -> Response:
    return proxy_backend_request("/health", method="GET")


@app.post("/demo-backend/triage")
async def proxy_backend_triage(request: Request) -> Response:
    return proxy_backend_request(
        "/triage",
        method="POST",
        body=await request.body(),
        content_type=request.headers.get("content-type", "application/json"),
        fallback_json={
            "severity": "configuração necessária",
            "owner": "demo local",
            "isDuplicate": False,
            "summary": (
                "Backend da demo nao esta respondendo. Clique em Executar backend no arquivo "
                "triage-service.ts e tente novamente. Este resultado e um fallback visual."
            ),
        },
    )


def normalized_backend_path(path: str) -> str:
    normalized = path.replace("\\", "/").lstrip("/")
    if not normalized.startswith(RUNNABLE_BACKEND_PREFIX):
        raise HTTPException(
            status_code=400,
            detail="Por seguranca, somente arquivos em demo-issue-triage/backend podem ser executados.",
        )
    if not normalized.endswith((".ts", ".js")):
        raise HTTPException(status_code=400, detail="Somente arquivos backend .ts ou .js podem ser executados.")
    return normalized


def backend_run_response(path: str, status: str, message: str) -> BackendRunResponse:
    url = f"http://localhost:{BACKEND_RUN_PORT}"
    return BackendRunResponse(
        status=status,
        path=path,
        url=url,
        triageUrl=f"{url}/triage",
        message=message,
    )


def stop_backend_process(process: subprocess.Popen) -> None:
    process.terminate()
    try:
        process.wait(timeout=2)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=2)


def proxy_backend_request(
    path: str,
    method: str,
    body: bytes | None = None,
    content_type: str = "application/json",
    fallback_json: dict | None = None,
) -> Response:
    url = f"http://127.0.0.1:{BACKEND_RUN_PORT}{path}"
    request = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={"Content-Type": content_type},
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as upstream:
            return Response(
                content=upstream.read(),
                media_type=upstream.headers.get_content_type() or "application/json",
                status_code=upstream.status,
            )
    except urllib.error.URLError as exc:
        if fallback_json is not None:
            return Response(
                content=json.dumps(fallback_json, ensure_ascii=False),
                media_type="application/json",
                status_code=200,
            )
        raise HTTPException(
            status_code=503,
            detail=(
                "Backend da demo nao esta respondendo. Clique em Executar backend no arquivo triage-service.ts "
                "e tente novamente."
            ),
        ) from exc
