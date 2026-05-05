# AgentFlow Studio

AgentFlow Studio is a study project for building a visual multi-agent orchestration platform with a Spring Boot backend, a Python orchestrator, a React frontend, PostgreSQL, LangGraph, MCP, A2A-like contracts, and Groq.

## Current Stage

The backend foundation is complete and the next planned stage is CRUD for projects and agents:

- Java + Spring Boot + Maven
- PostgreSQL
- Flyway migrations
- `GET /api/health`
- initial `projects` table

## Local Backend

```bash
cd backend
./mvnw test
```

```bash
docker compose up --build
```

The default Docker Compose command currently starts PostgreSQL and the backend. Frontend and orchestrator services are kept behind the `future` profile until their implementation stages.
