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
Etapa 2 — CRUD de projetos e agentes
Status: Próxima
```

Objetivo da etapa atual:

Implementar persistência inicial de projetos e agentes sobre o backend Java/Spring Boot já criado.

Arquivos esperados nesta etapa:

```txt
controllers/services/dtos de projetos
controllers/services/dtos de agentes
migrations adicionais quando necessário
testes de services/controllers
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

A definir após criação do projeto Python.

Comandos esperados:

```bash
cd orchestrator
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend React

A definir após criação do projeto Vite.

Comandos esperados:

```bash
cd frontend
npm install
npm run dev
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

Executar a Etapa 2:

1. Implementar CRUD de projetos.
2. Implementar CRUD de agentes por projeto.
3. Adicionar validações básicas.
4. Adicionar testes relevantes.
5. Atualizar este `AGENTS.md`.
