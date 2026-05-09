# Spec - AgentFlow Studio

> Plataforma visual e dinâmica para criação, conexão e execução de pipelines multiagentes com LangGraph, LangChain, MCP, A2A e Groq.

## 1. Visão do produto

O **AgentFlow Studio** é uma plataforma de orquestração de agentes de IA onde usuários podem criar projetos, definir agentes, configurar prompts, conectar agentes entre si, passar contexto entre etapas, associar ferramentas externas via MCP e executar pipelines multiagentes de forma visual e rastreável.

A proposta é permitir que diferentes usuários criem fluxos livres, mas controlados, para resolver tarefas textuais e técnicas, como:

- refinar ideias de negócio;
- escrever textos, poemas, histórias e resumos;
- gerar código;
- revisar código;
- criar testes;
- revisar saídas de outros agentes;
- enriquecer contexto com arquivos `.txt`, entradas manuais ou ferramentas externas;
- executar pipelines compostos por múltiplos agentes especializados.

A plataforma **não terá geração de imagens na primeira versão**. O foco da V1 é orquestração textual, raciocínio, geração de conteúdo, geração/revisão de código e uso seguro de ferramentas externas.

## 2. Objetivo de estudo

Este projeto é um laboratório pessoal para estudar e consolidar, na prática:

- orquestração multiagente;
- LangGraph;
- LangChain;
- integração com LLMs via Groq;
- MCP como camada de conexão com ferramentas externas;
- A2A como conceito/protocolo de comunicação agent-to-agent;
- arquitetura frontend + backend + serviço de orquestração;
- execução dinâmica de pipelines configuráveis pelo usuário;
- rastreabilidade de execuções;
- design orientado a especificação usando Spec-Driven Development.

O projeto deve ser desenvolvido de forma incremental, validável e documentada.

## 3. Princípios de Spec-Driven Development

Este repositório deve seguir uma abordagem de **Spec-Driven Development**, onde a especificação vem antes da implementação.

A spec deve funcionar como fonte de verdade para:

- objetivos do produto;
- escopo;
- requisitos funcionais;
- requisitos não funcionais;
- arquitetura;
- etapas de implementação;
- critérios de aceite;
- limitações conscientes;
- decisões técnicas.

Antes de implementar qualquer etapa, o agente responsável deve:

1. Ler este `spec.md`.
2. Ler o `AGENTS.md`.
3. Entender a etapa atual.
4. Propor um plano curto quando a etapa for grande ou ambígua.
5. Implementar somente o escopo da etapa solicitada.
6. Validar o resultado.
7. Atualizar o `AGENTS.md` com progresso, decisões, arquivos alterados e próximos passos.

O agente **não deve tentar implementar todo o `spec.md` de uma vez**.

## 4. Nome sugerido do projeto

Nome principal recomendado:

```txt
agentflow-studio
```

Descrição curta:

```txt
A dynamic multi-agent orchestration platform to create, connect and execute AI agent workflows using LangGraph, LangChain, MCP, A2A and Groq.
```

## 5. Stack principal

### 5.1 Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Flow para canvas visual de agentes
- TanStack Query para chamadas HTTP e cache de estado remoto
- Zustand ou Context API para estado local simples

### 5.2 Backend principal

- Java
- Spring Boot
- Maven
- Spring Web
- Spring Validation
- Spring Data JPA
- PostgreSQL
- Flyway para migrations

### 5.3 Serviço de orquestração

- Python
- FastAPI
- LangChain
- LangGraph
- Pydantic
- Cliente Groq
- Integração com MCP
- Futuro adaptador A2A

### 5.4 Infra local

- Docker Compose
- PostgreSQL
- Serviço backend Java/Spring Boot
- Serviço orchestrator Python
- Serviço frontend React

## 6. Componentes do sistema

### 6.1 Frontend - AgentFlow Studio UI

Responsável por permitir que o usuário:

- crie projetos;
- visualize projetos existentes;
- crie agentes dentro de um projeto;
- configure nome, descrição, prompt e tipo de agente;
- conecte agentes em um canvas visual;
- defina contexto inicial da execução;
- anexe ou cole conteúdo textual;
- escolha quais ferramentas MCP cada agente pode usar;
- execute uma pipeline;
- acompanhe status da execução;
- visualize outputs intermediários e output final;
- visualize logs e rastros básicos da execução.

### 6.2 Backend Java - Core API

Responsável por:

- autenticação simples ou mockada na V1;
- gestão de projetos;
- gestão de agentes;
- gestão de conexões entre agentes;
- persistência de pipelines;
- persistência de execuções;
- comunicação com o serviço Python de orquestração;
- exposição de APIs REST para o frontend.

### 6.3 Orchestrator Python - Agent Runtime

Responsável por:

- receber uma definição de pipeline do backend;
- transformar agentes e conexões em um grafo LangGraph;
- executar agentes na ordem correta;
- passar contexto entre agentes;
- chamar LLM via Groq;
- chamar tools externas via MCP, quando permitido;
- produzir traces da execução;
- retornar outputs intermediários e resultado final.

### 6.4 MCP Tool Layer

Responsável por permitir que agentes usem ferramentas externas de forma controlada.

Na V1, a integração MCP deve ser simples e extensível. Exemplos de tools futuras:

- leitura de arquivos locais controlados;
- criação de arquivos locais controlados;
- consulta a APIs públicas;
- pesquisa web controlada;
- consulta a banco de dados local de estudo;
- busca em documentos textuais;
- chamada a serviços internos mockados.

O uso de MCP deve ser explicitamente permitido por agente. Um agente sem tools associadas não pode chamar tools externas.

No refinamento pós-V1, as tools locais devem continuar restritas por `allowedTools` e por um workspace configurável. Escrita e leitura de arquivos não devem receber acesso irrestrito ao repositório inteiro por padrão. Geração de imagem é permitida apenas como tool opcional e condicionada a provider com free tier configurado por variável de ambiente.

### 6.5 A2A Adapter

A2A deve ser tratado inicialmente como uma camada de contrato e evolução.

Na V1, o sistema pode implementar comunicação agent-to-agent internamente usando LangGraph e um formato próprio de mensagens.

A arquitetura deve preparar espaço para um futuro adaptador A2A, permitindo:

- descrever capabilities de agentes;
- enviar mensagens estruturadas entre agentes;
- receber respostas de agentes internos ou externos;
- futuramente conectar agentes remotos compatíveis com A2A.

## 7. Conceitos centrais de domínio

### 7.1 Project

Representa um agrupador de pipelines, agentes, contexto e execuções.

Campos mínimos:

- `id`
- `name`
- `description`
- `createdAt`
- `updatedAt`

### 7.2 Agent

Representa uma unidade especializada de execução.

Campos mínimos:

- `id`
- `projectId`
- `name`
- `description`
- `systemPrompt`
- `agentType`
- `modelProvider`
- `modelName`
- `temperature`
- `allowedTools`
- `createdAt`
- `updatedAt`

Tipos iniciais sugeridos:

- `IDEATION`
- `WRITING`
- `CODE_GENERATION`
- `CODE_REVIEW`
- `TEST_GENERATION`
- `SUMMARY`
- `CRITIC`
- `GENERAL`

### 7.3 Pipeline

Representa um grafo de agentes dentro de um projeto.

Campos mínimos:

- `id`
- `projectId`
- `name`
- `description`
- `nodes`
- `edges`
- `createdAt`
- `updatedAt`

### 7.4 PipelineNode

Representa um agente dentro de uma pipeline.

Campos mínimos:

- `id`
- `agentId`
- `positionX`
- `positionY`
- `inputMapping`
- `outputKey`

### 7.5 PipelineEdge

Representa uma conexão entre dois agentes.

Campos mínimos:

- `id`
- `sourceNodeId`
- `targetNodeId`
- `contextMapping`

### 7.6 Execution

Representa uma execução da pipeline.

Campos mínimos:

- `id`
- `pipelineId`
- `status`
- `initialInput`
- `finalOutput`
- `startedAt`
- `finishedAt`
- `errorMessage`

Status iniciais:

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

### 7.7 ExecutionStep

Representa a execução de um agente dentro de uma pipeline.

Campos mínimos:

- `id`
- `executionId`
- `nodeId`
- `agentId`
- `status`
- `input`
- `output`
- `toolCalls`
- `startedAt`
- `finishedAt`
- `errorMessage`

## 8. Exemplos de uso

### 8.1 Pipeline para produto digital

Um usuário cria um projeto para refinar uma ideia de produto.

Pipeline:

1. **Business Refiner Agent**
   - Entrada: ideia inicial do usuário.
   - Saída: proposta de produto mais clara.
2. **User Story Agent**
   - Entrada: proposta refinada.
   - Saída: histórias de usuário.
3. **Code Generator Agent**
   - Entrada: histórias de usuário.
   - Saída: esqueleto de código.
4. **Test Writer Agent**
   - Entrada: código gerado.
   - Saída: testes sugeridos.
5. **Reviewer Agent**
   - Entrada: código + testes.
   - Saída: revisão técnica.

### 8.2 Pipeline para poema

Um usuário cria um projeto para escrita criativa.

Pipeline:

1. **Idea Refiner Agent**
   - Entrada: tema ou sentimento inicial.
   - Saída: ideia refinada.
2. **Poem Brief Agent**
   - Entrada: ideia refinada.
   - Saída: resumo de intenção, tom e estilo.
3. **Poem Writer Agent**
   - Entrada: resumo do poema.
   - Saída: poema.
4. **Poem Critic Agent**
   - Entrada: poema.
   - Saída: sugestões de melhoria.
5. **Final Polisher Agent**
   - Entrada: poema + crítica.
   - Saída: versão final.

## 9. Requisitos funcionais

### RF01 - Criar projeto

O usuário deve conseguir criar um projeto com nome e descrição.

Critérios de aceite:

- Deve existir uma API para criação de projeto.
- Deve existir uma tela simples para criação de projeto.
- Projetos devem ser persistidos no PostgreSQL.

### RF02 - Listar projetos

O usuário deve conseguir listar projetos existentes.

Critérios de aceite:

- Deve existir endpoint de listagem.
- A UI deve exibir os projetos em cards ou tabela simples.

### RF03 - Criar agente

O usuário deve conseguir criar agentes dentro de um projeto.

Critérios de aceite:

- O agente deve possuir nome, descrição, prompt e tipo.
- O agente deve permitir configuração de provider/modelo.
- Na V1, o provider principal será Groq.

### RF04 - Criar pipeline visual

O usuário deve conseguir montar uma pipeline visual conectando agentes.

Critérios de aceite:

- A UI deve usar React Flow ou equivalente.
- O usuário deve conseguir adicionar nodes de agentes.
- O usuário deve conseguir conectar nodes.
- O grafo deve ser salvo no backend.

### RF05 - Validar pipeline

Antes de executar, a pipeline deve ser validada.

Critérios de aceite:

- Não deve permitir execução sem nodes.
- Não deve permitir execução com ciclos na V1.
- Deve validar se existe pelo menos um node inicial.
- Deve validar se todos os nodes referenciam agentes válidos.

### RF06 - Executar pipeline

O usuário deve conseguir executar uma pipeline com contexto inicial.

Critérios de aceite:

- O backend deve criar um registro de execução.
- O backend deve chamar o serviço Python.
- O serviço Python deve executar o grafo.
- O resultado final deve ser persistido.

### RF07 - Passar contexto entre agentes

A saída de um agente deve poder ser usada como entrada de outro.

Critérios de aceite:

- Cada step deve receber input derivado do contexto acumulado.
- Cada agente deve produzir output rastreável.
- O contexto final deve conter outputs intermediários.

### RF08 - Usar Groq como LLM provider

Os agentes devem poder chamar modelos via Groq.

Critérios de aceite:

- A chave da Groq deve vir de variável de ambiente.
- O modelo deve ser configurável.
- O runtime deve ter timeout e tratamento de erro básico.

### RF09 - Associar tools MCP a agentes

Um agente deve poder ter uma lista de ferramentas permitidas.

Critérios de aceite:

- O modelo de agente deve suportar `allowedTools`.
- O orchestrator deve respeitar essa lista.
- Tools não permitidas não podem ser chamadas.

### RF10 - Registrar traces de execução

O sistema deve registrar etapas da execução.

Critérios de aceite:

- Cada agente executado deve gerar um `ExecutionStep`.
- Devem ser registrados input, output, status, erro e duração.
- Tool calls devem ser registradas quando existirem.

### RF11 - Preparar contrato A2A

O sistema deve preparar um contrato interno para comunicação agent-to-agent.

Critérios de aceite:

- Deve existir um formato de mensagem entre agentes.
- O formato deve conter sender, receiver, content, context e metadata.
- A implementação inicial pode ser interna, sem servidor A2A externo.

## 10. Requisitos não funcionais

### RNF01 - Simplicidade local

O projeto deve rodar localmente com Docker Compose.

### RNF02 - Separação clara de responsabilidades

Frontend, backend e orchestrator devem ser módulos separados.

### RNF03 - Segurança básica

- Não expor secrets no repositório.
- Usar `.env.example`.
- Validar entradas principais.
- Restringir tools MCP por agente.

### RNF04 - Observabilidade mínima

- Logs estruturados onde possível.
- Registro de execuções e steps.
- Erros claros para debug.

### RNF05 - Evolução incremental

Cada etapa deve ser pequena, validável e registrada no `AGENTS.md`.

## 11. APIs iniciais do backend Java

### Projects

```http
POST /api/projects
GET /api/projects
GET /api/projects/{projectId}
PUT /api/projects/{projectId}
DELETE /api/projects/{projectId}
```

### Agents

```http
POST /api/projects/{projectId}/agents
GET /api/projects/{projectId}/agents
GET /api/projects/{projectId}/agents/{agentId}
PUT /api/projects/{projectId}/agents/{agentId}
DELETE /api/projects/{projectId}/agents/{agentId}
```

### Pipelines

```http
POST /api/projects/{projectId}/pipelines
GET /api/projects/{projectId}/pipelines
GET /api/projects/{projectId}/pipelines/{pipelineId}
PUT /api/projects/{projectId}/pipelines/{pipelineId}
DELETE /api/projects/{projectId}/pipelines/{pipelineId}
POST /api/projects/{projectId}/pipelines/{pipelineId}/validate
```

### Executions

```http
POST /api/projects/{projectId}/pipelines/{pipelineId}/executions
GET /api/projects/{projectId}/pipelines/{pipelineId}/executions
GET /api/executions/{executionId}
GET /api/executions/{executionId}/steps
```

## 12. Contrato inicial Backend para Orchestrator

Endpoint no orchestrator Python:

```http
POST /orchestrations/run
```

Payload esperado:

```json
{
  "executionId": "uuid",
  "projectId": "uuid",
  "pipeline": {
    "id": "uuid",
    "nodes": [],
    "edges": []
  },
  "agents": [],
  "initialInput": {
    "content": "texto inicial do usuário",
    "attachments": []
  }
}
```

Resposta esperada:

```json
{
  "executionId": "uuid",
  "status": "COMPLETED",
  "finalOutput": "resultado final",
  "steps": []
}
```

## 13. Contrato interno de mensagem A2A-like

Na V1, usar um contrato interno inspirado em comunicação agent-to-agent:

```json
{
  "messageId": "uuid",
  "executionId": "uuid",
  "senderAgentId": "uuid-or-system",
  "receiverAgentId": "uuid",
  "content": "mensagem ou contexto principal",
  "context": {
    "previousOutputs": {},
    "initialInput": ""
  },
  "metadata": {
    "stepIndex": 1,
    "pipelineId": "uuid"
  }
}
```

Esse contrato deve permitir futura evolução para A2A real/remoto.

## 14. Estrutura inicial do repositório

```txt
agentflow-studio/
  README.md
  spec.md
  AGENTS.md
  docker-compose.yml
  .env.example
  backend/
    pom.xml
    mvnw
    mvnw.cmd
    .mvn/
    src/
  orchestrator/
    pyproject.toml
    app/
      main.py
      schemas/
      services/
      graph/
      llm/
      mcp/
      a2a/
  frontend/
    package.json
    index.html
    src/
      main.tsx
      App.tsx
      components/
      pages/
      api/
      flows/
```

## 15. Etapas de implementação

### Etapa 0 - Bootstrap do repositório

Objetivo:

Criar a estrutura base do projeto.

Tarefas:

- Criar `README.md`.
- Criar `spec.md`.
- Criar `AGENTS.md`.
- Criar `.env.example`.
- Criar diretórios `backend`, `frontend`, `orchestrator`.
- Criar `docker-compose.yml` inicial.

Critérios de aceite:

- Estrutura de pastas existe.
- Arquivos principais existem.
- `AGENTS.md` contém progresso inicial.

### Etapa 1 - Backend Java básico

Objetivo:

Criar backend Spring Boot com Maven, health check e conexão PostgreSQL.

Tarefas:

- Criar projeto Java/Spring Boot com Maven.
- Configurar PostgreSQL.
- Configurar Flyway.
- Criar endpoint `GET /api/health`.
- Criar entidade e migration de `projects`.

Critérios de aceite:

- Backend sobe localmente.
- Health check responde.
- Migration executa.

### Etapa 2 - CRUD de projetos e agentes

Objetivo:

Implementar persistência inicial de projetos e agentes.

Tarefas:

- CRUD de projetos.
- CRUD de agentes por projeto.
- Validações básicas.
- Testes unitários dos services.

Critérios de aceite:

- APIs principais funcionam.
- Agentes são vinculados a projetos.

### Etapa 3 - Orchestrator Python básico

Objetivo:

Criar serviço Python com FastAPI e health check.

Tarefas:

- Criar projeto Python.
- Configurar FastAPI.
- Criar `GET /health`.
- Criar `POST /orchestrations/run` mockado.

Critérios de aceite:

- Serviço sobe localmente.
- Endpoint mock retorna execução simulada.

### Etapa 4 - Integração Backend para Orchestrator

Objetivo:

Permitir que o backend chame o serviço Python.

Tarefas:

- Criar client HTTP no backend.
- Criar endpoint de execução no backend.
- Persistir execução com status.
- Chamar orchestrator mockado.
- Atualizar execução com resultado.

Critérios de aceite:

- Uma execução pode ser disparada pelo backend.
- O resultado mock é persistido.

### Etapa 5 - Frontend básico

Objetivo:

Criar UI inicial para projetos e agentes.

Tarefas:

- Criar app React/Vite.
- Configurar Tailwind.
- Criar tela de projetos.
- Criar tela de agentes do projeto.
- Integrar com backend.

Critérios de aceite:

- Usuário cria projeto pela UI.
- Usuário cria agente pela UI.

### Etapa 6 - Pipeline visual

Objetivo:

Permitir montagem visual de pipelines.

Tarefas:

- Instalar React Flow.
- Criar canvas de pipeline.
- Adicionar nodes representando agentes.
- Criar edges entre agentes.
- Salvar grafo no backend.

Critérios de aceite:

- Usuário monta e salva pipeline visual.

### Etapa 7 - Execução real com LangGraph

Objetivo:

Executar pipeline real no orchestrator usando LangGraph.

Tarefas:

- Converter nodes/edges em grafo LangGraph.
- Executar agentes sequencialmente conforme grafo.
- Passar contexto entre nodes.
- Retornar steps intermediários.

Critérios de aceite:

- Pipeline simples com 2 ou mais agentes executa.
- Outputs intermediários são retornados.

### Etapa 8 - Integração com Groq

Objetivo:

Permitir que agentes chamem LLM via Groq.

Tarefas:

- Criar adapter Groq.
- Ler `GROQ_API_KEY` do ambiente.
- Configurar modelo padrão.
- Aplicar prompt do agente.
- Tratar timeout e erro.

Critérios de aceite:

- Agente executa chamada real para Groq.
- Resultado volta para a pipeline.

### Etapa 9 - Registro de traces

Objetivo:

Persistir detalhes da execução.

Tarefas:

- Criar tabela de execution steps.
- Persistir input/output por agente.
- Persistir erro por step.
- Exibir steps na UI.

Critérios de aceite:

- Usuário visualiza histórico da execução.

### Etapa 10 - MCP básico

Objetivo:

Adicionar suporte inicial a tools via MCP.

Tarefas:

- Criar módulo `orchestrator/app/mcp`.
- Definir contrato de tool permitida.
- Implementar chamada mock ou simples de MCP.
- Associar tools a agentes.
- Registrar tool calls.

Critérios de aceite:

- Um agente pode usar uma tool permitida.
- Um agente não pode usar tool não permitida.

### Etapa 11 - A2A-like adapter

Objetivo:

Criar camada interna de mensagens agent-to-agent.

Tarefas:

- Criar módulo `orchestrator/app/a2a`.
- Criar schema de mensagem.
- Usar schema entre steps do LangGraph.
- Preparar documentação para futura integração A2A externa.

Critérios de aceite:

- Mensagens entre agentes seguem contrato definido.

### Etapa 12 - UX de execução e refinamento

Objetivo:

Melhorar experiência de uso da plataforma.

Tarefas:

- Tela de execução.
- Status por node.
- Output intermediário por agente.
- Output final destacado.
- Mensagens de erro claras.

Critérios de aceite:

- Usuário entende o que aconteceu na execução.

## 16. Fora de escopo na V1

- Geração de imagens.
- Execução de código arbitrário sem sandbox.
- Autenticação robusta multiusuário.
- Marketplace de agentes.
- Deploy em cloud.
- Billing.
- Permissões avançadas por organização.
- Edição colaborativa em tempo real.
- A2A remoto completo.
- MCP marketplace completo.

## 17. Riscos e cuidados

### Prompt injection

Agentes com acesso a tools podem ser induzidos a executar ações indesejadas.

Mitigação inicial:

- tools explicitamente permitidas;
- logs de tool calls;
- evitar tools destrutivas;
- não expor secrets no prompt.

### Execuções longas

Pipelines com muitos agentes podem demorar.

Mitigação inicial:

- timeout por agente;
- status de execução;
- limite inicial de nodes por pipeline.

Limite sugerido na V1:

```txt
Máximo de 10 agentes por pipeline.
```

### Complexidade do grafo

Grafos cíclicos tornam execução mais complexa.

Mitigação inicial:

```txt
A V1 não deve permitir ciclos.
```

## 18. Variáveis de ambiente esperadas

```env
POSTGRES_DB=agentflow
POSTGRES_USER=agentflow
POSTGRES_PASSWORD=agentflow
DATABASE_URL=jdbc:postgresql://postgres:5432/agentflow
DATABASE_USERNAME=agentflow
DATABASE_PASSWORD=agentflow
ORCHESTRATOR_BASE_URL=http://orchestrator:8000
GROQ_API_KEY=replace-me
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
HF_TOKEN=replace-me
HF_IMAGE_PROVIDER=wavespeed
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_IMAGE_FALLBACKS=together|black-forest-labs/FLUX.1-schnell,hf-inference|black-forest-labs/FLUX.1-schnell,hf-inference|stabilityai/stable-diffusion-3-medium-diffusers
FRONTEND_API_BASE_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080
```

## 19. Definition of Done geral

Uma etapa só deve ser considerada concluída quando:

- o escopo da etapa foi implementado;
- a aplicação compila ou sobe localmente;
- testes relevantes foram criados ou atualizados quando aplicável;
- a documentação necessária foi atualizada;
- o `AGENTS.md` foi atualizado com:
  - etapa concluída;
  - arquivos alterados;
  - decisões tomadas;
  - pendências;
  - próxima etapa recomendada.

## 20. Instrução final para agentes implementadores

Ao usar este arquivo, não implemente tudo de uma vez.

Siga este ciclo:

1. Leia `spec.md`.
2. Leia `AGENTS.md`.
3. Identifique a etapa atual.
4. Implemente uma etapa pequena.
5. Valide.
6. Atualize `AGENTS.md`.
7. Recomende ao usuário o próximo passo.
