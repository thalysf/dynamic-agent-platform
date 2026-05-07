# AgentFlow Studio

AgentFlow Studio is a study project for building a visual multi-agent orchestration platform with a Spring Boot backend, a Python orchestrator, a React frontend, PostgreSQL, LangGraph, MCP, A2A-like contracts, and Groq.

## Current Stage

The initial V1 scope from stages 0 through 12 is implemented:

- Java + Spring Boot + Maven
- PostgreSQL
- Flyway migrations
- Project and agent CRUD APIs
- Pipeline and execution APIs
- Backend pipeline validation for V1 DAG rules
- Execution step persistence and trace APIs
- Python FastAPI orchestrator with health check and `/orchestrations/run`
- LangGraph-based pipeline execution
- Groq adapter with local mock fallback when `GROQ_API_KEY` is not configured
- Controlled MCP-like tool registry for the V1
- Internal A2A-like message contract in the orchestrator
- React + Vite + Tailwind UI split into Home, Projects, Agents, Studio and Playground
- Dedicated project and agent management with create, edit, delete and inspection views
- Dedicated visual Studio for graph modeling and dedicated Playground for execution tests

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

Local secrets belong in `.env`, which is ignored by Git. Use `.env.example` only as a safe template.
