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
Pós-V1 — Refinamento de interfaces e hardening
Status: Próxima
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

---

### Registro 006 — Separação de interfaces do frontend e configuração Groq local

Status:

```txt
Concluído
```

Resumo:

O frontend foi reorganizado em interfaces próprias: Home, Projetos, Agentes, Studio e Playground. Projetos agora têm tela dedicada para criação, edição, deleção, seleção e visualização. Agentes têm tela dedicada para criação, edição, deleção e inspeção clara de responsabilidade, prompt, modelo, temperatura e tools permitidas. O Studio ficou focado em modelagem visual de fluxos com React Flow. O Playground ficou focado em testar pipelines prontos, executar inputs, consultar histórico e inspecionar traces. Também foi configurado o `.env` local ignorado pelo Git com as variáveis reais de Groq fornecidas pelo usuário, sem registrar a chave em arquivos rastreáveis.

Arquivos criados/alterados:

```txt
AGENTS.md
README.md
.env.example
docker-compose.yml
frontend/src/App.tsx
frontend/src/api/client.ts
frontend/src/components/AppShell.tsx
frontend/src/constants/agents.ts
frontend/src/flows/AgentFlowNode.tsx
frontend/src/flows/flowUtils.ts
frontend/src/flows/types.ts
frontend/src/pages/AgentsPage.tsx
frontend/src/pages/HomePage.tsx
frontend/src/pages/PlaygroundPage.tsx
frontend/src/pages/ProjectsPage.tsx
frontend/src/pages/StudioPage.tsx
orchestrator/app/llm/groq_client.py
.env (local ignorado pelo Git)
```

Decisões tomadas:

- A navegação do frontend usa hash routing simples para evitar adicionar roteador antes de necessidade real.
- A tela de agentes prioriza legibilidade operacional: descrição do que o agente faz, system prompt, modelo, temperatura e tools ficam visíveis.
- O Studio mantém `@xyflow/react` isolado em tela própria, com `ReactFlowProvider`, `nodeTypes` estável e validação de conexão sem self edge.
- O Playground não edita grafos; ele apenas testa pipelines salvos e apresenta histórico/traces.
- O client frontend agora expõe update/delete de projetos, agentes e pipelines, usando os endpoints já existentes no backend.
- `GROQ_FALLBACK_MODELS` foi adicionado ao Docker Compose e ao `.env.example`.
- O adapter Groq tenta o modelo principal e depois os fallbacks configurados antes de falhar a execução.
- O token real do Groq foi colocado somente no `.env` local, que é ignorado por `.gitignore`.

Validações executadas:

```txt
git check-ignore -v .env
frontend/npm run build
backend/./mvnw.cmd test
orchestrator/python -m pytest
docker compose config --quiet
docker compose up --build -d
GET http://localhost:8080/api/health
GET http://localhost:8000/health
GET http://localhost:5173
container orchestrator carregou GROQ_API_KEY real sem imprimir o segredo
rg "gsk_" fora de .env sem resultados
POST /api/projects
POST /api/projects/{projectId}/agents
POST /api/projects/{projectId}/pipelines
POST /api/projects/{projectId}/pipelines/{pipelineId}/validate
POST /api/projects/{projectId}/pipelines/{pipelineId}/executions com Groq real
GET /api/executions/{executionId}/steps
DELETE /api/projects/{projectId} para limpar dados temporários
```

Resultado da validação integrada com Groq real:

```txt
pipelineValid: true
executionStatus: COMPLETED
finalOutput: OK
stepCount: 1
```

Pendências:

- Adicionar testes de UI/componentes para as novas telas do frontend.
- Melhorar edição visual com feedback mais granular e atalhos de teclado.
- Evoluir a navegação de hash routing simples para roteamento dedicado caso a aplicação cresça.

Próximo passo recomendado:

```txt
Adicionar testes de UI/componentes e seguir refinando ergonomia do Studio e Playground.
```

---

### Registro 007 — Playground com esteira animada de execução

Status:

```txt
Concluído
```

Resumo:

A tela de Playground foi refinada para mostrar uma esteira visual animada da execução da pipeline. Antes e durante a chamada ao backend, o frontend deriva os steps a partir dos nodes/edges salvos no Studio, ordena os nodes topologicamente e anima o step em execução, avançando para os próximos como uma pipeline amigável de CI/CD. Após a resposta do orchestrator, a tela sincroniza com os traces reais persistidos e mantém o histórico, o resultado final, input, output e tool calls de cada step.

Arquivos criados/alterados:

```txt
AGENTS.md
frontend/src/App.tsx
frontend/src/pages/PlaygroundPage.tsx
frontend/src/styles.css
```

Decisões tomadas:

- A animação fica somente no Playground, preservando a separação de responsabilidades entre Home, Projetos, Agentes, Studio e Playground.
- Como a execução ainda é síncrona no backend, o frontend mostra uma simulação de progresso baseada no grafo salvo e troca para os dados reais assim que a execução retorna.
- A ordenação visual usa os nodes e edges do React Flow para exibir a sequência esperada dos agentes.
- Os cards reais de traces foram mantidos e melhorados com status visual, áreas separadas para input/output e tool calls formatadas.
- As animações respeitam `prefers-reduced-motion`.

Validações executadas:

```txt
frontend/npm run build
docker compose up --build -d frontend
GET http://localhost:5173/#playground
GET http://localhost:8080/api/health
git diff --check
```

Pendências:

- Considerar streaming ou polling real de status de execução no backend/orchestrator para substituir a simulação visual por progresso em tempo real.
- Adicionar testes de UI/componentes para o Playground animado.

Próximo passo recomendado:

```txt
Evoluir execução assíncrona/streaming para status real por step quando o backend estiver pronto para isso.
```

---

### Registro 008 — Playground com grafo animado, paralelismo e balões de atividade

Status:

```txt
Concluído
```

Resumo:

O Playground deixou de representar a execução como uma lista linear e passou a desenhar o grafo salvo da pipeline. A visualização agora calcula níveis do DAG a partir dos nodes/edges do React Flow, permitindo mostrar branches paralelos corretamente. Por exemplo, se `Agent A` aponta para `Agent B` e também para `Agent C`, `B` e `C` aparecem no mesmo nível visual; etapas seguintes aparecem apenas depois de suas dependências. Também foram adicionadas conexões animadas entre nodes e balões de atividade para o step em execução, indicando ações como preparar prompt, checar tools e enviar contexto aos próximos agentes.

Arquivos criados/alterados:

```txt
AGENTS.md
frontend/src/pages/PlaygroundPage.tsx
frontend/src/styles.css
```

Decisões tomadas:

- A paleta da parte animada foi reduzida para azul escuro e verde, removendo a faixa amarelo/azul/verde anterior.
- O grafo usa uma ordenação por níveis derivada das dependências, não apenas uma sequência topológica achatada.
- Edges são desenhadas em SVG e mudam de estado conforme a execução visual avança: pendente, ativa, concluída ou falha.
- A animação continua sendo uma simulação visual no frontend enquanto o backend executa de forma síncrona; ao final, a tela sincroniza com os traces reais persistidos.
- Os balões explicam o que o step ativo está fazendo sem substituir os cards reais de input/output/tool calls.

Validações executadas:

```txt
frontend/npm run build
docker compose up --build -d frontend
GET http://localhost:5173/#playground
GET http://localhost:8080/api/health
docker compose ps
git diff --check
```

Pendências:

- Quando houver execução assíncrona ou streaming no backend, trocar o avanço simulado por eventos reais por step.
- Adicionar testes de UI para grafos com branches paralelos.

Próximo passo recomendado:

```txt
Criar execução assíncrona com status por step para alimentar a animação com progresso real.
```

---

### Registro 009 — Correção de contexto por arestas diretas no DAG

Status:

```txt
Concluído
```

Resumo:

Foi corrigida a semântica de passagem de contexto no orchestrator. O runtime não trata mais a ordenação topológica como uma fila linear. Cada node agora recebe apenas o output dos seus predecessores diretos; branches paralelos não vazam contexto entre si. Quando um node possui múltiplos predecessores, ele recebe um contexto agregado apenas desses predecessores. Também foi ajustado o Playground para reduzir cortes visuais durante a execução, com espaçamento calculado a partir da altura real dos cards, padding extra para balões e área do grafo sem clipping interno.

Arquivos criados/alterados:

```txt
AGENTS.md
frontend/src/pages/PlaygroundPage.tsx
frontend/src/styles.css
orchestrator/app/graph/pipeline_graph.py
orchestrator/tests/test_main.py
```

Decisões tomadas:

- O LangGraph agora é montado com as arestas reais do DAG em vez de uma cadeia linear artificial.
- `outputs` e `steps` usam reducers para acumular resultados de branches paralelos sem sobrescrever estado.
- Inputs de agentes são construídos a partir dos predecessores diretos:
  - sem predecessor: input inicial do usuário;
  - um predecessor: output daquele predecessor;
  - múltiplos predecessores: agregação dos outputs diretos.
- O output final vem dos nodes terminais do grafo.
- O teste de branching cobre o caso `A -> B`, `A -> C`, `B -> D`, `C -> D`, garantindo que `C` não receba o output de `B` e que `D` receba `B` e `C`.

Validações executadas:

```txt
orchestrator/python -m pytest
frontend/npm run build
docker compose up --build -d orchestrator frontend
GET http://localhost:8080/api/health
GET http://localhost:8000/health
GET http://localhost:5173/#playground
docker compose ps
git diff --check
```

Pendências:

- Criar streaming ou polling real por step para substituir a animação simulada do Playground por status emitidos pelo orchestrator.

Próximo passo recomendado:

```txt
Projetar execução assíncrona com eventos de progresso por node.
```

### Registro 010 — Playground interativo com viewport acompanhando execução

Status:

```txt
Concluído
```

Resumo:

O Playground foi refinado para usar React Flow também na visualização de execução, mantendo a paleta existente. A pipeline agora pode ser arrastada e navegada com zoom/pan como no Studio, e durante a execução o viewport acompanha e centraliza os steps ativos, evitando que cards sejam cortados mesmo em fluxos com múltiplos estágios. A linha inferior de continuidade teve o azul escuro trocado por um azul mais claro e nítido, preservando o verde da identidade visual.

Arquivos criados/alterados:

```txt
AGENTS.md
frontend/src/pages/PlaygroundPage.tsx
frontend/src/styles.css
```

Decisões tomadas:

- A visualização runtime passou a usar `ReactFlowProvider`, `useReactFlow` e `fitView` para controlar o viewport de forma estável.
- `nodeTypes` foi mantido fora do componente para evitar recriações desnecessárias.
- Os nodes de execução continuam com a coloração escura/verde/azul já aprovada, mas o canvas agora permite pan/zoom e mini mapa.
- A faixa inferior de continuidade usa azul claro com verde para ficar mais minimalista e legível.

Validações executadas:

```txt
frontend/npm run build
orchestrator/python -m pytest
docker compose up --build -d frontend
GET http://localhost:8080/api/health
GET http://localhost:8000/health
GET http://localhost:5173/#playground
docker compose ps
git diff --check
```

Pendências:

- Evoluir a execução para eventos reais por node, substituindo a animação temporizada por progresso emitido pelo orchestrator.

Próximo passo recomendado:

```txt
Implementar streaming ou polling de progresso por step no Playground.
```

### Registro 011 — Refinamento visual dos controles do Playground

Status:

```txt
Concluído
```

Resumo:

Foram refinados os controles nativos do React Flow no Playground. Os botões de zoom, centralização e bloqueio deixaram de usar o branco/cinza padrão e passaram para um tema escuro com ícones em azul claro, hover em azul petróleo e melhor integração com o canvas. O minimapa também recebeu fundo escuro, máscara mais suave e nodes coloridos por status. A faixa inferior de continuidade voltou a usar azul turquesa com verde.

Arquivos criados/alterados:

```txt
AGENTS.md
frontend/src/pages/PlaygroundPage.tsx
frontend/src/styles.css
```

Decisões tomadas:

- O tema dos controles foi feito por CSS escopado em `.runtime-flow` para não afetar outros usos de React Flow.
- O `MiniMap` recebeu cores por props do próprio React Flow, mantendo o componente nativo.
- A faixa inferior usa verde azulado e verde para preservar contraste sem ficar estourada.

Validações executadas:

```txt
frontend/npm run build
docker compose up --build -d frontend
GET http://localhost:5173/#playground
```

Pendências:

- Validar visualmente em diferentes tamanhos de tela quando houver testes de UI automatizados.

Próximo passo recomendado:

```txt
Adicionar teste visual/integração leve para o Playground quando a suíte de frontend for criada.
```

### Registro 012 — Minimap informativo e prompt com hover

Status:

```txt
Concluído
```

Resumo:

O Playground recebeu dois refinamentos de leitura visual. A faixa inferior de continuidade deixou o turquesa anterior e passou para um verde azulado mais integrado ao layout. O minimapa agora usa um node SVG customizado para mostrar `Step N` e o nome do agente, mantendo cores por status. Os cards de execução também passaram a exibir o system prompt como uma prévia compacta de duas linhas, com o conteúdo completo disponível em popover ao passar o mouse ou focar o bloco.

Arquivos criados/alterados:

```txt
AGENTS.md
frontend/src/pages/PlaygroundPage.tsx
frontend/src/styles.css
```

Decisões tomadas:

- O `MiniMap` usa `nodeComponent` com contexto local para receber metadados dos steps sem acoplar o componente ao estado global.
- O texto do minimapa é curto por design: `Step N` e nome do agente truncado, com `title` SVG para leitura completa nativa.
- O system prompt usa `white-space: pre-wrap` e `overflow-wrap: anywhere` para preservar quebras e evitar estouro visual.

Validações executadas:

```txt
frontend/npm run build
docker compose up --build -d frontend
```

Pendências:

- Validar o tamanho ideal do minimapa em telas menores quando houver teste visual automatizado.

Próximo passo recomendado:

```txt
Adicionar teste visual do Playground cobrindo minimapa, prompts longos e estados de execução.
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
2. Melhorar UX do editor visual e dos traces de execução.
3. Evoluir MCP básico para integração real controlada.
4. Considerar roteamento dedicado no frontend quando houver mais telas.
5. Atualizar este `AGENTS.md`.
