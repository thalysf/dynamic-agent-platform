# AGENTS.md - AgentFlow Studio

Este arquivo guarda o contexto operacional consolidado do projeto para agentes de IA. A fonte principal de escopo continua sendo `spec.md`.

## Regras Para Agentes

Antes de implementar qualquer coisa:

1. Leia `spec.md` por completo.
2. Leia este `AGENTS.md` por completo.
3. Trabalhe em uma mudanca pequena, testavel e coerente com a etapa atual.
4. Nao reverta mudancas existentes sem pedido explicito.
5. Nao exponha secrets e nao commite `.env` real.
6. Ao concluir, atualize este arquivo somente com informacao consolidada e util para manutencao futura.

## Estado Atual

Status:

```txt
Pos-V1 - Refinamento de interfaces, hardening e organizacao de codigo
```

A V1 esta implementada com:

- CRUD de projetos e agentes.
- Studio visual para montar pipelines com React Flow.
- Playground para executar pipelines e inspecionar resumo, traces, tool calls, imagens e arquivos gerados.
- Backend Spring Boot com validacao de pipelines, execucoes e persistencia de steps.
- Orchestrator FastAPI com LangGraph, Groq com fallback local, tools controladas e contrato interno A2A-like.
- Tools controladas: `word_count`, `echo_context`, `file_write`, `file_read`, `web_search`, `image_generate`.

## Arquitetura

- `backend/`: Java, Spring Boot, Maven, PostgreSQL, Flyway. Gerencia dominio, persistencia, validacoes, APIs REST e chamada ao orchestrator.
- `orchestrator/`: Python, FastAPI, LangGraph e Groq. Executa grafos de agentes, aplica prompts, chama tools permitidas e retorna traces.
- `frontend/`: React, TypeScript, Vite, Tailwind CSS e React Flow. Entrega UI de projetos, agentes, Studio e Playground.
- `tool-workspace/`: workspace controlado para arquivos gerados/lidos por tools. Deve continuar fora do escopo do repositorio rastreado.

## Decisoes Consolidadas

- O projeto deve ser agnostico: nao implementar codigo especifico para uma demonstracao dentro do produto.
- Arquivos gerados por agentes pertencem ao workspace de tools e nao devem exigir rotas ou proxies especificos do AgentFlow para funcionar.
- A execucao arbitraria de codigo continua fora do escopo seguro do produto.
- O Playground pode abrir arquivos gerados por `file_write`, aplicar preview por extensao e executar HTML abrindo o arquivo em nova aba.
- `file_write` roda depois da resposta do agente para salvar o artefato gerado, nao o input bruto.
- `file_read` fica restrito a `AGENTFLOW_TOOL_WORKDIR` e seleciona arquivos por path/nome, nao por varredura de conteudo.
- `web_search` possui fallbacks simples para melhorar resiliencia quando a query inicial for especifica demais.
- A validacao de grafo do backend fica isolada em `PipelineGraphValidator`.
- Helpers puros do frontend devem ficar fora de paginas grandes quando crescerem, como em `frontend/src/pages/playground/filePreview.tsx`.
- Helpers de formatacao do orchestrator devem ficar separados das tools, como em `orchestrator/app/mcp/file_formatting.py`.

## Variaveis Importantes

```env
POSTGRES_DB=agentflow
POSTGRES_USER=agentflow
POSTGRES_PASSWORD=agentflow
DATABASE_URL=jdbc:postgresql://postgres:5432/agentflow
DATABASE_USERNAME=agentflow
DATABASE_PASSWORD=agentflow
ORCHESTRATOR_BASE_URL=http://orchestrator:8000
ORCHESTRATOR_PUBLIC_BASE_URL=http://localhost:8000
ORCHESTRATOR_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GROQ_API_KEY=replace-me
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_FALLBACK_MODELS=llama-3.3-70b-versatile,llama-3.1-8b-instant
AGENTFLOW_TOOL_WORKDIR=./tool-workspace
AGENTFLOW_HOST_TOOL_WORKDIR=./tool-workspace
AGENTFLOW_TOOL_MAX_READ_BYTES=65536
WEB_SEARCH_TIMEOUT_SECONDS=8
HF_TOKEN=replace-me
HF_IMAGE_PROVIDER=wavespeed
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
VITE_API_BASE_URL=http://localhost:8080
```

## Comandos De Validacao

Backend:

```bash
cd backend
./mvnw test
```

Orchestrator:

```bash
cd orchestrator
python -m pytest
```

Frontend:

```bash
cd frontend
npm run build
```

Stack local:

```bash
docker compose config --quiet
docker compose up --build -d
```

Health checks:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8000/health
curl http://localhost:5173
```

## Ultimo Avanco Consolidado

Resumo:

- Removidos testes e referencias de execucao/proxy especificos de demo.
- Mantidas apenas capacidades genericas do produto para preview de arquivos, abertura de HTML, tool workspace e traces.
- `ORCHESTRATOR_CORS_ORIGINS` foi exposto como configuracao.
- `PlaygroundPage.tsx` foi reduzido com extracao de preview/syntax highlight para modulo dedicado.
- Preview de arquivos Markdown no Playground renderiza headings, listas, negrito, italico e inline code sem `dangerouslySetInnerHTML`.
- `tools.py` foi reduzido com extracao da formatacao HTML para modulo dedicado.
- `PipelineService` foi simplificado com a validacao de grafo em `PipelineGraphValidator`.
- CSS antigo nao usado da visualizacao runtime anterior foi removido.

Arquivos principais alterados:

```txt
AGENTS.md
README.md
.env.example
docker-compose.yml
backend/src/main/java/com/thalys/agentflow/service/PipelineGraphValidator.java
backend/src/main/java/com/thalys/agentflow/service/PipelineService.java
frontend/src/pages/PlaygroundPage.tsx
frontend/src/pages/playground/filePreview.tsx
frontend/src/styles.css
orchestrator/app/main.py
orchestrator/app/mcp/file_formatting.py
orchestrator/app/mcp/tools.py
orchestrator/tests/test_main.py
orchestrator/tests/test_tools.py
```

Validacoes recentes:

```txt
backend/./mvnw.cmd test
orchestrator/python -m pytest
frontend/npm run build
docker compose config --quiet
docker compose up --build -d
smoke ponta a ponta via API: health checks UP, pipeline valida, execucao COMPLETED, 2 steps, tool word_count registrada
```

## Proximos Passos Recomendados

- Adicionar testes especificos para `PipelineGraphValidator`.
- Criar testes de UI/componentes para Playground e Studio.
- Evoluir execucao para streaming ou polling real por step.
- Continuar quebrando `PlaygroundPage.tsx` em componentes menores quando houver nova mudanca funcional.
- Manter qualquer projeto demonstrativo como configuracao/dados de uso, nunca como codigo acoplado ao produto.
