# AgentFlow Studio

AgentFlow Studio is a study project for building a visual multi-agent orchestration platform with a Spring Boot backend, a Python orchestrator, a React frontend, PostgreSQL, LangGraph, MCP, A2A-like contracts, and Groq.

## Current Stage

Stages 2 through 5 are implemented:

- Java + Spring Boot + Maven
- PostgreSQL
- Flyway migrations
- Project and agent CRUD APIs
- Basic pipeline and execution APIs for mocked runs
- Python FastAPI orchestrator with health check and mocked `/orchestrations/run`
- React + Vite + Tailwind UI for creating projects and agents

## Local Development

```bash
cd backend
./mvnw test
```

```bash
cd orchestrator
python -m pytest
```

```bash
cd frontend
npm run build
```

```bash
docker compose up --build
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/api/health`
- Orchestrator health: `http://localhost:8000/health`
