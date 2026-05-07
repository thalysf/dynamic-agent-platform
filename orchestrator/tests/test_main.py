from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "UP"
    assert response.json()["service"] == "agentflow-orchestrator"


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
