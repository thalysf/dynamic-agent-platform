# AGENTS.md — AgentFlow Studio

Este arquivo guarda instruções, contexto operacional e progresso do projeto para agentes de IA que forem ajudar na implementação.

O objetivo é manter continuidade entre sessões, evitando perda de contexto sobre decisões técnicas, etapas concluídas, próximos passos e comandos úteis.

---

## 1. Instrução principal para agentes

Antes de qualquer implementação:

1. Leia `spec.md` por completo.
2. Leia este `AGENTS.md` por completo.
3. Identifique a etapa atual do projeto.
4. Trabalhe em uma etapa pequena e validável.
5. Não implemente várias etapas grandes de uma vez.
6. Ao terminar, atualize este arquivo com:
   - etapa trabalhada;
   - resumo do que foi feito;
   - arquivos criados/alterados;
   - decisões técnicas;
   - pendências;
   - próximos passos recomendados.

Este projeto segue **Spec-Driven Development**. A implementação deve seguir o `spec.md` como fonte principal de escopo.

---

## 2. Visão resumida do projeto

Projeto: **AgentFlow Studio**

Objetivo:

Construir uma plataforma visual e dinâmica de orquestração multiagente onde usuários possam criar projetos, definir agentes, configurar prompts, conectar agentes em pipelines, passar contexto entre eles e permitir uso controlado de ferramentas externas via MCP.

Stack principal:

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Flow.
- Backend: Java, Spring Boot, Maven, PostgreSQL, Flyway.
- Orchestrator: Python, FastAPI, LangChain, LangGraph, Groq, MCP e A2A-like adapter.
- Infra local: Docker Compose.

---

## 3. Escopo da V1

A V1 deve focar em:

- projetos;
- agentes;
- pipelines visuais;
- execução de pipelines textuais;
- integração com Groq;
- passagem de contexto entre agentes;
- rastreabilidade de execução;
- suporte inicial a MCP;
- contrato interno A2A-like.

Fora de escopo na V1:

- geração de imagens;
- execução arbitrária de código sem sandbox;
- autenticação robusta;
- billing;
- marketplace;
- deploy em cloud;
- A2A remoto completo.

---

## 4. Regras de implementação

### 4.1 Não fazer tudo de uma vez

O agente deve orientar o usuário a seguir por etapas.

Não execute todo o `spec.md` em uma única solicitação.

### 4.2 Preservar simplicidade

Este é um projeto pessoal de estudo. Prefira soluções simples, legíveis e evolutivas.

Evite abstrações complexas antes de necessidade real.

### 4.3 Separar responsabilidades

- Backend Java/Spring Boot gerencia domínio, persistência e APIs.
- Orchestrator Python executa grafos de agentes.
- Frontend React oferece interface visual.
- PostgreSQL persiste dados estruturados.

### 4.4 Não expor secrets

Nunca commitar `.env` real.

Usar apenas `.env.example` com valores fictícios.

### 4.5 Atualizar este arquivo sempre

Ao concluir qualquer avanço relevante, este arquivo deve ser atualizado.

---

## 5. Etapa atual

Status atual:

```txt
V1 inicial — Etapas 0 a 12
Status: Concluída
```

Objetivo da etapa atual:

Refinar a V1 implementada, ampliar cobertura de testes, melhorar UX e evoluir integrações reais sem sair do escopo seguro do projeto.

Arquivos esperados nesta etapa:

```txt
testes adicionais de controllers/services
ajustes de UX no editor visual e tela de execução
integração MCP real controlada
validação com GROQ_API_KEY real em ambiente local
documentação incremental
```

---

## 6. Progresso registrado

### Registro 001 — Criação da spec inicial

Status:

```txt
Concluído parcialmente
```

Resumo:

Foi definida a primeira versão do `spec.md`, descrevendo visão do produto, stack, arquitetura, requisitos funcionais, requisitos não funcionais, entidades principais, etapas de implementação, integração com Groq, MCP e camada A2A-like.

Arquivos criados/alterados:

```txt
spec.md
AGENTS.md
docker-compose.yml
```

Decisões tomadas:

- Nome recomendado do projeto: `agentflow-studio`.
- Frontend será React + TypeScript + Vite + Tailwind + React Flow.
- Backend principal será Java + Spring Boot + Maven.
- Orquestração será feita em Python com FastAPI, LangGraph e LangChain.
- Groq será o provider inicial de LLM.
- MCP será usado como camada de tools externas.
- A2A será preparado inicialmente como contrato interno A2A-like.
- V1 não terá geração de imagens.
- V1 não permitirá grafos cíclicos.
- V1 deve limitar pipelines a até 10 agentes inicialmente.

Pendências:

- Criar `README.md`.
- Criar `.env.example`.
- Criar estrutura real de pastas do repositório.
- Inicializar backend Java/Spring Boot com Maven.
- Inicializar orchestrator Python.
- Inicializar frontend React.

Próximo passo recomendado:

```txt
Concluir Etapa 0 criando README.md, .env.example e estrutura inicial de diretórios.
```

---

## 7. Comandos úteis previstos

### Docker Compose

```bash
docker compose up --build
```

```bash
docker compose down
```

### Backend Java/Spring Boot

Comandos do backend Maven:

Comandos esperados:

```bash
cd backend
./mvnw spring-boot:run
```

```bash
cd backend
./mvnw test
```

### Orchestrator Python

```bash
cd orchestrator
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd orchestrator
python -m pytest
```

### Frontend React

```bash
cd frontend
npm install
npm run dev
```

```bash
cd frontend
npm run build
```

---

## 8. Convenções técnicas iniciais

### Backend Java/Spring Boot

Pacote base sugerido:

```txt
com.thalys.agentflow
```

Camadas sugeridas:

```txt
controller
service
repository
domain
dto
client
config
```

### Orchestrator Python

Estrutura sugerida:

```txt
app/
  main.py
  schemas/
  services/
  graph/
  llm/
  mcp/
  a2a/
```

### Frontend

Estrutura sugerida:

```txt
src/
  api/
  components/
  pages/
  flows/
  hooks/
  types/
```

### Skills locais para Codex

Este projeto usa skills versionadas em `.agents/skills/`, que é o caminho relevante para o Codex neste repositório.

Skills já integradas:

- `sdd:plan`
  - Alias local para a skill upstream `plan-task`.
  - Usar quando o usuário pedir `sdd:plan` explicitamente ou quando for melhor refinar uma spec/tarefa antes de implementar.
- `groq-api`
  - Usar para integrações, decisões técnicas e código relacionado à API da Groq.
- `langgraph-fundamentals`
  - Usar ao implementar ou revisar grafos, estado, nodes e edges no orchestrator.
- `mcp-integration`
  - Usar para integração de MCP, configuração de tools externas e contratos relacionados.
- `vercel-react-best-practices`
  - Usar ao implementar, revisar ou otimizar código React no frontend.
- `react-flow`
  - Usar ao construir o editor visual de pipelines com `@xyflow/react`.
- `synapse-a2a`
  - Usar ao desenhar ou revisar comunicação agent-to-agent e coordenação multiagente.

Regra de compatibilidade:

- Se o nome exato pedido pelo usuário não existir no repositório upstream, procurar a skill equivalente mais próxima, usar essa equivalente e registrar o mapeamento no projeto.

---

### Registro 002 — Integração de skills para Codex

Status:

```txt
Concluído
```

Resumo:

Foram integradas skills de projeto focadas no fluxo do Codex para Groq, LangGraph, MCP, React, React Flow e Synapse A2A. Também foi criado um alias local `sdd:plan` porque o nome upstream disponível para esse caso atualmente é `plan-task`.

Arquivos criados/alterados:

```txt
AGENTS.md
skills-lock.json
.agents/skills/groq-api/
.agents/skills/langgraph-fundamentals/
.agents/skills/mcp-integration/
.agents/skills/plan-task/
.agents/skills/react-flow/
.agents/skills/synapse-a2a/
.agents/skills/vercel-react-best-practices/
.agents/skills/sdd-planning/SKILL.md
```

Decisões tomadas:

- As skills ficaram registradas no escopo do projeto para uso pelo Codex via `.agents/skills/`.
- O nome pedido `sdd:plan` foi mantido por meio de um alias local apontando para a skill equivalente `plan-task`.
- Quando um nome upstream exato não existir, o agente deve procurar a skill semelhante mais adequada e documentar o mapeamento.

Pendências:

- Validar essas skills na prática conforme backend, frontend e orchestrator forem sendo implementados.
- Itens restantes da Etapa 0 foram concluídos no Registro 003.

Próximo passo recomendado:

```txt
Seguir para a Etapa 1 criando o backend Java/Spring Boot com Maven.
```

---

### Registro 003 — Backend Java/Spring Boot básico com Maven

Status:

```txt
Concluído
```

Resumo:

Foi executada a Etapa 1 com backend Java/Spring Boot usando Maven, por preferência explícita do usuário de não usar Gradle. Também foram concluídos os itens restantes da Etapa 0, incluindo `README.md`, `.env.example` e diretórios base `frontend/` e `orchestrator/`.

Arquivos criados/alterados:

```txt
README.md
spec.md
AGENTS.md
.gitignore
.env.example
docker-compose.yml
backend/pom.xml
backend/mvnw
backend/mvnw.cmd
backend/.mvn/wrapper/maven-wrapper.properties
backend/Dockerfile
backend/src/main/java/com/thalys/agentflow/AgentflowApplication.java
backend/src/main/java/com/thalys/agentflow/controller/HealthController.java
backend/src/main/java/com/thalys/agentflow/controller/HealthResponse.java
backend/src/main/java/com/thalys/agentflow/domain/Project.java
backend/src/main/java/com/thalys/agentflow/repository/ProjectRepository.java
backend/src/main/resources/application.yml
backend/src/main/resources/db/migration/V1__create_projects_table.sql
backend/src/test/java/com/thalys/agentflow/controller/HealthControllerTest.java
frontend/.gitkeep
orchestrator/.gitkeep
```

Decisões tomadas:

- Backend será Java + Spring Boot + Maven, sem Gradle.
- Foi usado Spring Boot 3.5.14 com Java 17 para manter uma base estável e compatível.
- O backend já possui health check em `GET /api/health`.
- O Flyway cria a tabela inicial `projects`.
- Os serviços `frontend` e `orchestrator` ficam no profile `future` do Docker Compose até suas etapas de implementação.
- Os testes do health check usam slice MVC para não dependerem de PostgreSQL.

Validações executadas:

```txt
backend/./mvnw test
backend/./mvnw package
docker compose config --quiet
docker compose up --build -d postgres backend
GET http://localhost:8080/api/health
select version, description, success from flyway_schema_history order by installed_rank;
```

Pendências:

- Implementar a Etapa 2 com CRUD de projetos e agentes.
- Criar services, DTOs, validações e testes para projetos e agentes.
- Implementar orchestrator Python apenas na Etapa 3.
- Implementar frontend React apenas na Etapa 5.

Próximo passo recomendado:

```txt
Executar a Etapa 2 — CRUD de projetos e agentes.
```

---

### Registro 004 — Etapas 2 a 5 implementadas

Status:

```txt
Concluído
```

Resumo:

Foram executadas as Etapas 2, 3, 4 e 5. O backend agora possui CRUD de projetos e agentes, além de modelos mínimos de pipelines e execuções para permitir disparar execuções mockadas no orchestrator. O orchestrator Python foi criado com FastAPI, health check e endpoint `POST /orchestrations/run` mockado. O frontend React/Vite/Tailwind foi criado com uma UI inicial para criar projetos, selecionar projeto e criar agentes vinculados ao projeto.

Arquivos criados/alterados:

```txt
README.md
.gitignore
docker-compose.yml
backend/.dockerignore
backend/src/main/resources/application.yml
backend/src/main/resources/db/migration/V2__create_agents_pipelines_executions.sql
backend/src/main/java/com/thalys/agentflow/client/OrchestratorClient.java
backend/src/main/java/com/thalys/agentflow/config/ApiExceptionHandler.java
backend/src/main/java/com/thalys/agentflow/config/WebConfig.java
backend/src/main/java/com/thalys/agentflow/controller/ProjectController.java
backend/src/main/java/com/thalys/agentflow/controller/AgentController.java
backend/src/main/java/com/thalys/agentflow/controller/PipelineController.java
backend/src/main/java/com/thalys/agentflow/controller/ExecutionController.java
backend/src/main/java/com/thalys/agentflow/domain/Project.java
backend/src/main/java/com/thalys/agentflow/domain/Agent.java
backend/src/main/java/com/thalys/agentflow/domain/AgentType.java
backend/src/main/java/com/thalys/agentflow/domain/Pipeline.java
backend/src/main/java/com/thalys/agentflow/domain/Execution.java
backend/src/main/java/com/thalys/agentflow/domain/ExecutionStatus.java
backend/src/main/java/com/thalys/agentflow/dto/
backend/src/main/java/com/thalys/agentflow/repository/
backend/src/main/java/com/thalys/agentflow/service/
backend/src/test/java/com/thalys/agentflow/controller/ProjectControllerTest.java
backend/src/test/java/com/thalys/agentflow/service/
orchestrator/.dockerignore
orchestrator/Dockerfile
orchestrator/pyproject.toml
orchestrator/app/
orchestrator/tests/test_main.py
frontend/.dockerignore
frontend/Dockerfile
frontend/package.json
frontend/package-lock.json
frontend/index.html
frontend/vite.config.ts
frontend/tailwind.config.js
frontend/postcss.config.js
frontend/tsconfig.json
frontend/src/
```

Decisões tomadas:

- O backend mantém Java/Spring Boot/Maven e separação simples em controller, service, repository, domain, dto, client e config.
- `Agent.allowedTools` foi modelado como `@ElementCollection`, suficiente para a V1.
- `Pipeline` e `Execution` mínimos foram adicionados já na Etapa 4 para permitir disparo e persistência de execução mockada, mesmo que o editor visual completo seja da Etapa 6.
- `nodesJson` e `edgesJson` ficam como texto JSON por simplicidade inicial; a Etapa 6 pode salvar o grafo do React Flow nesses campos.
- O client Java do orchestrator força HTTP/1.1 para evitar upgrade HTTP incompatível com o Uvicorn em Docker.
- O frontend usa React client-side simples com Vite e Tailwind, sem adicionar TanStack Query ainda, para preservar simplicidade nesta etapa.
- O Docker Compose agora sobe postgres, backend, orchestrator e frontend por padrão.

Validações executadas:

```txt
backend/./mvnw test
orchestrator/python -m pytest
frontend/npm run build
docker compose config --quiet
docker compose up --build -d
GET http://localhost:8080/api/health
GET http://localhost:8000/health
GET http://localhost:5173
POST /api/projects
POST /api/projects/{projectId}/agents
POST /api/projects/{projectId}/pipelines
POST /api/projects/{projectId}/pipelines/{pipelineId}/executions
```

Resultado da validação integrada:

```txt
executionStatus: COMPLETED
finalOutput: [Writer] mock response for: Hello from backend validation
```

Pendências:

- Implementar Etapa 6 com pipeline visual usando React Flow.
- Adicionar validação real de pipelines, incluindo grafo sem ciclos e pelo menos um node inicial.
- Persistir `ExecutionStep` e traces detalhados na Etapa 9.
- Substituir execução mockada por LangGraph real na Etapa 7.
- Integrar Groq real apenas na Etapa 8.

Próximo passo recomendado:

```txt
Executar a Etapa 6 — Pipeline visual com React Flow.
```

---

### Registro 005 — Etapas 6 a 12 implementadas

Status:

```txt
Concluído
```

Resumo:

Foram executadas as Etapas 6, 7, 8, 9, 10, 11 e 12. O frontend agora possui editor visual de pipelines com React Flow, criação e seleção de pipelines, adição de agentes como nodes, conexão por edges, validação, execução e exibição de histórico/traces. O backend valida pipelines antes da execução, impede grafos inválidos para a V1, chama o orchestrator, persiste execuções e grava `ExecutionStep` com input, output, status, tool calls, timestamps e erros. O orchestrator passou a executar o pipeline com LangGraph, usar um adapter Groq com fallback mock local, registrar tools MCP-like permitidas e montar mensagens internas A2A-like.

Arquivos criados/alterados:

```txt
README.md
AGENTS.md
backend/src/main/java/com/thalys/agentflow/config/ApiExceptionHandler.java
backend/src/main/java/com/thalys/agentflow/controller/ExecutionController.java
backend/src/main/java/com/thalys/agentflow/controller/PipelineController.java
backend/src/main/java/com/thalys/agentflow/domain/ExecutionStep.java
backend/src/main/java/com/thalys/agentflow/dto/ExecutionStepResponse.java
backend/src/main/java/com/thalys/agentflow/dto/PipelineValidationResponse.java
backend/src/main/java/com/thalys/agentflow/repository/ExecutionStepRepository.java
backend/src/main/java/com/thalys/agentflow/service/ExecutionService.java
backend/src/main/java/com/thalys/agentflow/service/PipelineService.java
backend/src/main/resources/db/migration/V3__create_execution_steps_table.sql
backend/src/test/java/com/thalys/agentflow/service/ExecutionServiceTest.java
frontend/package.json
frontend/package-lock.json
frontend/src/App.tsx
frontend/src/api/client.ts
orchestrator/pyproject.toml
orchestrator/app/a2a/
orchestrator/app/graph/
orchestrator/app/llm/
orchestrator/app/mcp/
orchestrator/app/schemas/orchestration.py
orchestrator/app/services/mock_orchestrator.py
orchestrator/tests/test_main.py
```

Decisões tomadas:

- O editor visual usa `@xyflow/react`, mantendo nodes e edges serializados nos campos `nodesJson` e `edgesJson` do backend.
- A validação de pipeline fica no backend como barreira principal antes da execução.
- A V1 aceita no máximo 10 nodes, exige pelo menos um node inicial, valida agentes por projeto, rejeita self edges, edges com endpoints inexistentes e ciclos.
- O runtime LangGraph executa os nodes em ordem topológica sequencial na V1, preservando passagem de contexto de forma previsível.
- O adapter Groq usa chamada real apenas quando `GROQ_API_KEY` estiver configurada e diferente de `replace-me`; sem chave real, usa fallback mock local para desenvolvimento e testes.
- O suporte MCP inicial é uma registry controlada com tools mockadas (`word_count` e `echo_context`), executadas somente quando listadas em `allowedTools` do agente.
- O contrato A2A-like foi modelado no orchestrator como mensagem interna para registrar sender, receiver, conteúdo, contexto e metadados.

Validações executadas:

```txt
backend/./mvnw.cmd test
orchestrator/python -m pytest
frontend/npm run build
docker compose config --quiet
docker compose up --build -d
POST /api/projects
POST /api/projects/{projectId}/agents
POST /api/projects/{projectId}/pipelines
POST /api/projects/{projectId}/pipelines/{pipelineId}/validate
POST /api/projects/{projectId}/pipelines/{pipelineId}/executions
GET /api/executions/{executionId}/steps
```

Resultado da validação integrada:

```txt
pipelineValid: true
executionStatus: COMPLETED
stepCount: 2
firstStepTool: word_count COMPLETED
secondStepTool: echo_context COMPLETED
```

Pendências:

- Validar uma execução com `GROQ_API_KEY` real em ambiente local.
- Adicionar testes de controller para validação de pipelines, execuções e steps.
- Melhorar operações do editor visual, como remoção explícita de nodes/edges e feedback visual de salvamento.
- Evoluir MCP de registry mockada para integração MCP real e segura.
- Considerar paginação/filtros para histórico de execuções conforme volume crescer.

Próximo passo recomendado:

```txt
Entrar em refinamento pós-V1: hardening, testes adicionais, UX e integração Groq/MCP real controlada.
```

## 9. Contratos importantes

### Backend para Orchestrator

Endpoint esperado:

```http
POST /orchestrations/run
```

O backend deve enviar:

- executionId;
- projectId;
- pipeline;
- agents;
- initialInput.

O orchestrator deve retornar:

- executionId;
- status;
- finalOutput;
- steps.

### Mensagem interna A2A-like

Formato base:

```json
{
  "messageId": "uuid",
  "executionId": "uuid",
  "senderAgentId": "uuid-or-system",
  "receiverAgentId": "uuid",
  "content": "message content",
  "context": {},
  "metadata": {}
}
```

---

## 10. Cuidados de segurança

- Não permitir tools destrutivas na V1.
- Não expor `GROQ_API_KEY` em logs ou prompts.
- Não commitar `.env` real.
- Validar pipelines antes da execução.
- Registrar tool calls para auditoria.
- Não permitir execução arbitrária de código sem sandbox.

---

## 11. Como atualizar este arquivo

Ao final de cada etapa, adicionar um novo registro em `Progresso registrado` com este formato:

```md
### Registro NNN — Título curto

Status:

Resumo:

Arquivos criados/alterados:

Decisões tomadas:

Pendências:

Próximo passo recomendado:
```

Também atualizar a seção `Etapa atual` quando uma etapa for concluída.

---

## 12. Próxima ação recomendada para o agente

Executar refinamento pós-V1:

1. Ampliar testes automatizados de backend, frontend e orchestrator.
2. Validar execução real com `GROQ_API_KEY` local.
3. Melhorar UX do editor visual e dos traces de execução.
4. Evoluir MCP básico para integração real controlada.
5. Atualizar este `AGENTS.md`.
