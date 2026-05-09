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

## Controlled Agent Tools

Agents can only run tools explicitly enabled in `allowedTools`.

Available tools:

- `word_count`
- `echo_context`
- `file_write`
- `file_read`
- `web_search`
- `image_generate`

File tools are scoped to `AGENTFLOW_TOOL_WORKDIR`. In Docker, this is mounted from `AGENTFLOW_HOST_TOOL_WORKDIR`; locally this can point to your Desktop. `file_write` defaults to a timestamped file in that workspace when no path is provided. `file_read` reads from that workspace and, when no exact path is provided, searches for an explicitly mentioned or similar file name; if no good match exists, the tool call fails clearly.

Structured tool input can be sent as JSON in the pipeline input or previous agent output:

```json
{
  "file_write": {
    "path": "notes/example.md",
    "content": "# Hello",
    "overwrite": true
  },
  "file_read": {
    "path": "notes/example.md"
  },
  "web_search": {
    "query": "LangGraph StateGraph examples",
    "maxResults": 3
  },
  "image_generate": {
    "prompt": "A clean product mockup on a white desk",
    "path": "images/mockup.png"
  }
}
```

`file_write` also accepts `contentBase64` for binary files. `web_search` uses resilient fallbacks across DuckDuckGo instant answer, DuckDuckGo HTML results and Wikipedia OpenSearch. `image_generate` uses Google AI image models only when `GEMINI_API_KEY` is configured and the Google AI project has image-generation quota; otherwise the tool call is recorded as failed instead of breaking the whole app. It discovers available Google image models when `GEMINI_IMAGE_DISCOVERY_ENABLED=true`, tries Gemini/Nano Banana models first through `:generateContent`, and then tries Imagen models through `:predict`.

When no structured JSON is provided, `file_write` saves the received text to a timestamped `.txt` file in the tool workspace, and `image_generate` uses the received text as the prompt. Generated files include a local `publicUrl` so the Playground can preview images from tool calls.

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
