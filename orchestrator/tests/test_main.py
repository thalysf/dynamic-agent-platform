from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "UP"
    assert response.json()["service"] == "agentflow-orchestrator"


def test_tool_files_are_served_from_tool_workspace(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("AGENTFLOW_TOOL_WORKDIR", str(tmp_path))
    (tmp_path / "preview.txt").write_text("hello preview", encoding="utf-8")

    response = client.get("/tool-files/preview.txt")

    assert response.status_code == 200
    assert response.text == "hello preview"


def test_run_orchestration_mock() -> None:
    execution_id = str(uuid4())
    project_id = str(uuid4())
    pipeline_id = str(uuid4())
    node_id = str(uuid4())
    agent_id = str(uuid4())

    response = client.post(
        "/orchestrations/run",
        json={
            "executionId": execution_id,
            "projectId": project_id,
            "pipeline": {
                "id": pipeline_id,
                "nodes": [
                    {
                        "id": node_id,
                        "type": "agent",
                        "position": {"x": 0, "y": 0},
                        "data": {"agentId": agent_id, "label": "Writer"},
                    }
                ],
                "edges": [],
            },
            "agents": [
                {
                    "id": agent_id,
                    "projectId": project_id,
                    "name": "Writer",
                    "description": None,
                    "systemPrompt": "Write clearly",
                    "agentType": "WRITING",
                    "modelProvider": "groq",
                    "modelName": "llama-3.1-70b-versatile",
                    "temperature": 0.7,
                    "allowedTools": ["word_count"],
                }
            ],
            "initialInput": {"content": "hello", "attachments": []},
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["executionId"] == execution_id
    assert body["status"] == "COMPLETED"
    assert body["finalOutput"].startswith("[Writer]")
    assert len(body["steps"]) == 1
    assert body["steps"][0]["nodeId"] == node_id
    assert body["steps"][0]["toolCalls"][0]["toolName"] == "word_count"


def test_tool_failure_marks_step_as_failed(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("AGENTFLOW_TOOL_WORKDIR", str(tmp_path))
    execution_id = str(uuid4())
    project_id = str(uuid4())
    pipeline_id = str(uuid4())
    node_id = str(uuid4())
    agent_id = str(uuid4())

    response = client.post(
        "/orchestrations/run",
        json={
            "executionId": execution_id,
            "projectId": project_id,
            "pipeline": {
                "id": pipeline_id,
                "nodes": [
                    {
                        "id": node_id,
                        "type": "agent",
                        "position": {"x": 0, "y": 0},
                        "data": {"agentId": agent_id, "label": "Reader"},
                    }
                ],
                "edges": [],
            },
            "agents": [
                {
                    "id": agent_id,
                    "projectId": project_id,
                    "name": "Reader",
                    "description": None,
                    "systemPrompt": "Read files",
                    "agentType": "GENERAL",
                    "modelProvider": "groq",
                    "modelName": "llama-3.1-70b-versatile",
                    "temperature": 0.7,
                    "allowedTools": ["file_read"],
                }
            ],
            "initialInput": {"content": "Leia um arquivo sobre algo inexistente", "attachments": []},
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "COMPLETED"
    assert body["steps"][0]["status"] == "FAILED"
    assert body["steps"][0]["toolCalls"][0]["toolName"] == "file_read"
    assert body["steps"][0]["errorMessage"]


def test_branching_nodes_receive_only_direct_predecessor_context() -> None:
    execution_id = str(uuid4())
    project_id = str(uuid4())
    pipeline_id = str(uuid4())
    agent_a_id = str(uuid4())
    agent_b_id = str(uuid4())
    agent_c_id = str(uuid4())
    agent_d_id = str(uuid4())

    response = client.post(
        "/orchestrations/run",
        json={
            "executionId": execution_id,
            "projectId": project_id,
            "pipeline": {
                "id": pipeline_id,
                "nodes": [
                    {"id": "a", "type": "agent", "position": {"x": 0, "y": 0}, "data": {"agentId": agent_a_id}},
                    {"id": "b", "type": "agent", "position": {"x": 0, "y": 0}, "data": {"agentId": agent_b_id}},
                    {"id": "c", "type": "agent", "position": {"x": 0, "y": 0}, "data": {"agentId": agent_c_id}},
                    {"id": "d", "type": "agent", "position": {"x": 0, "y": 0}, "data": {"agentId": agent_d_id}},
                ],
                "edges": [
                    {"id": "a-b", "source": "a", "target": "b"},
                    {"id": "a-c", "source": "a", "target": "c"},
                    {"id": "b-d", "source": "b", "target": "d"},
                    {"id": "c-d", "source": "c", "target": "d"},
                ],
            },
            "agents": [
                {
                    "id": agent_a_id,
                    "projectId": project_id,
                    "name": "Agent A",
                    "description": None,
                    "systemPrompt": "A",
                    "agentType": "GENERAL",
                    "modelProvider": "groq",
                    "modelName": "llama-3.1-70b-versatile",
                    "temperature": 0.7,
                    "allowedTools": [],
                },
                {
                    "id": agent_b_id,
                    "projectId": project_id,
                    "name": "Agent B",
                    "description": None,
                    "systemPrompt": "B",
                    "agentType": "GENERAL",
                    "modelProvider": "groq",
                    "modelName": "llama-3.1-70b-versatile",
                    "temperature": 0.7,
                    "allowedTools": [],
                },
                {
                    "id": agent_c_id,
                    "projectId": project_id,
                    "name": "Agent C",
                    "description": None,
                    "systemPrompt": "C",
                    "agentType": "GENERAL",
                    "modelProvider": "groq",
                    "modelName": "llama-3.1-70b-versatile",
                    "temperature": 0.7,
                    "allowedTools": [],
                },
                {
                    "id": agent_d_id,
                    "projectId": project_id,
                    "name": "Agent D",
                    "description": None,
                    "systemPrompt": "D",
                    "agentType": "GENERAL",
                    "modelProvider": "groq",
                    "modelName": "llama-3.1-70b-versatile",
                    "temperature": 0.7,
                    "allowedTools": [],
                },
            ],
            "initialInput": {"content": "seed", "attachments": []},
        },
    )

    body = response.json()
    steps = {step["nodeId"]: step for step in body["steps"]}

    assert response.status_code == 200
    assert body["status"] == "COMPLETED"
    assert steps["a"]["input"] == "seed"
    assert steps["b"]["input"] == steps["a"]["output"]
    assert steps["c"]["input"] == steps["a"]["output"]
    assert steps["b"]["output"] in steps["d"]["input"]
    assert steps["c"]["output"] in steps["d"]["input"]
    assert steps["b"]["output"] not in steps["c"]["input"]
