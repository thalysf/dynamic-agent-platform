import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Connection,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Agent,
  AgentPayload,
  AgentType,
  Execution,
  ExecutionStep,
  Pipeline,
  Project,
  createAgent,
  createPipeline,
  createProject,
  listAgents,
  listExecutionSteps,
  listExecutions,
  listPipelines,
  listProjects,
  runPipeline,
  updatePipeline,
  validatePipeline,
} from './api/client';

type AgentNodeData = {
  label: string;
  agentId: string;
  agentType: string;
};

type AgentNode = Node<AgentNodeData, 'agent'>;

const AGENT_TYPES: AgentType[] = [
  'GENERAL',
  'IDEATION',
  'WRITING',
  'CODE_GENERATION',
  'CODE_REVIEW',
  'TEST_GENERATION',
  'SUMMARY',
  'CRITIC',
];

const DEFAULT_AGENT: AgentPayload = {
  name: '',
  description: '',
  systemPrompt: '',
  agentType: 'GENERAL',
  modelProvider: 'groq',
  modelName: 'llama-3.1-8b-instant',
  temperature: 0.7,
  allowedTools: [],
};

function AgentFlowNode({ data, selected }: NodeProps<AgentNode>) {
  return (
    <div className={`w-56 rounded border bg-white p-3 shadow-sm ${selected ? 'border-sky-500' : 'border-slate-300'}`}>
      <Handle className="h-3 w-3" type="target" position={Position.Left} />
      <p className="truncate text-sm font-semibold text-slate-950">{data.label}</p>
      <p className="mt-1 text-xs font-medium text-sky-700">{data.agentType}</p>
      <Handle className="h-3 w-3" type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  agent: AgentFlowNode,
};

function parseFlow<T>(json: string | null | undefined, fallback: T): T {
  if (!json) {
    return fallback;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState<AgentNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [agentForm, setAgentForm] = useState<AgentPayload>(DEFAULT_AGENT);
  const [toolInput, setToolInput] = useState('');
  const [pipelineForm, setPipelineForm] = useState({ name: 'Main Pipeline', description: '' });
  const [selectedAgentToAdd, setSelectedAgentToAdd] = useState('');
  const [initialInput, setInitialInput] = useState('');
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const selectedPipeline = useMemo(
    () => pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId],
  );

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data);
      setSelectedProjectId((current) => current || data[0]?.id || '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProjectData = useCallback(async (projectId: string) => {
    if (!projectId) {
      setAgents([]);
      setPipelines([]);
      setSelectedPipelineId('');
      return;
    }
    setError(null);
    try {
      const [agentData, pipelineData] = await Promise.all([listAgents(projectId), listPipelines(projectId)]);
      setAgents(agentData);
      setPipelines(pipelineData);
      setSelectedAgentToAdd(agentData[0]?.id || '');
      setSelectedPipelineId((current) => current || pipelineData[0]?.id || '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load project data');
    }
  }, []);

  const refreshExecutions = useCallback(async (projectId: string, pipelineId: string) => {
    if (!projectId || !pipelineId) {
      setExecutions([]);
      return;
    }
    try {
      setExecutions(await listExecutions(projectId, pipelineId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load executions');
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    void refreshProjectData(selectedProjectId);
  }, [refreshProjectData, selectedProjectId]);

  useEffect(() => {
    setNodes(parseFlow<AgentNode[]>(selectedPipeline?.nodesJson, []));
    setEdges(parseFlow<Edge[]>(selectedPipeline?.edgesJson, []));
    setPipelineForm({
      name: selectedPipeline?.name || 'Main Pipeline',
      description: selectedPipeline?.description || '',
    });
    setValidationErrors([]);
    setSelectedExecution(null);
    setExecutionSteps([]);
    if (selectedProjectId && selectedPipeline?.id) {
      void refreshExecutions(selectedProjectId, selectedPipeline.id);
    }
  }, [refreshExecutions, selectedPipeline, selectedProjectId, setEdges, setNodes]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const project = await createProject(projectForm);
      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
      setProjectForm({ name: '', description: '' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to create project');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const agent = await createAgent(selectedProjectId, {
        ...agentForm,
        allowedTools: toolInput
          .split(',')
          .map((tool) => tool.trim())
          .filter(Boolean),
      });
      setAgents((current) => [agent, ...current]);
      setSelectedAgentToAdd(agent.id);
      setAgentForm(DEFAULT_AGENT);
      setToolInput('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to create agent');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const pipeline = await createPipeline(selectedProjectId, {
        name: pipelineForm.name,
        description: pipelineForm.description,
        nodesJson: '[]',
        edgesJson: '[]',
      });
      setPipelines((current) => [pipeline, ...current]);
      setSelectedPipelineId(pipeline.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to create pipeline');
    } finally {
      setBusy(false);
    }
  }

  function addAgentNode() {
    const agent = agents.find((item) => item.id === selectedAgentToAdd);
    if (!agent) {
      return;
    }
    const nodeId = crypto.randomUUID();
    setNodes((current) => [
      ...current,
      {
        id: nodeId,
        type: 'agent',
        position: { x: 120 + current.length * 80, y: 120 + current.length * 40 },
        data: { label: agent.name, agentId: agent.id, agentType: agent.agentType },
      },
    ]);
  }

  function onConnect(connection: Connection) {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          id: crypto.randomUUID(),
          type: 'smoothstep',
          animated: true,
        },
        current,
      ),
    );
  }

  async function savePipeline() {
    if (!selectedProjectId || !selectedPipeline) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updatePipeline(selectedProjectId, selectedPipeline.id, {
        name: pipelineForm.name,
        description: pipelineForm.description,
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
      });
      setPipelines((current) => current.map((pipeline) => (pipeline.id === updated.id ? updated : pipeline)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to save pipeline');
    } finally {
      setBusy(false);
    }
  }

  async function validateCurrentPipeline() {
    if (!selectedProjectId || !selectedPipeline) {
      return;
    }
    await savePipeline();
    const validation = await validatePipeline(selectedProjectId, selectedPipeline.id);
    setValidationErrors(validation.errors);
  }

  async function executePipeline() {
    if (!selectedProjectId || !selectedPipeline || !initialInput.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await savePipeline();
      const validation = await validatePipeline(selectedProjectId, selectedPipeline.id);
      setValidationErrors(validation.errors);
      if (!validation.valid) {
        return;
      }
      const execution = await runPipeline(selectedProjectId, selectedPipeline.id, initialInput);
      setSelectedExecution(execution);
      setExecutions((current) => [execution, ...current]);
      setExecutionSteps(await listExecutionSteps(execution.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to execute pipeline');
    } finally {
      setBusy(false);
    }
  }

  async function selectExecution(execution: Execution) {
    setSelectedExecution(execution);
    setExecutionSteps(await listExecutionSteps(execution.id));
  }

  return (
    <ReactFlowProvider>
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 xl:grid-cols-[300px_360px_1fr]">
          <aside className="space-y-4">
            <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-xl font-semibold">AgentFlow Studio</h1>
                <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">V1</span>
              </div>
              <form className="space-y-3" onSubmit={handleCreateProject}>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  maxLength={120}
                  placeholder="Nome do projeto"
                  required
                  value={projectForm.name}
                  onChange={(event) => setProjectForm((form) => ({ ...form, name: event.target.value }))}
                />
                <textarea
                  className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  placeholder="Descricao"
                  value={projectForm.description}
                  onChange={(event) => setProjectForm((form) => ({ ...form, description: event.target.value }))}
                />
                <button className="w-full rounded bg-slate-950 px-3 py-2 text-sm font-semibold text-white" disabled={busy}>
                  Criar projeto
                </button>
              </form>
            </section>

            <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase text-slate-600">Projetos</h2>
                <button className="text-sm font-medium text-sky-700" onClick={() => void refreshProjects()} type="button">
                  Atualizar
                </button>
              </div>
              <div className="space-y-2">
                {loading ? <p className="text-sm text-slate-500">Carregando...</p> : null}
                {projects.map((project) => (
                  <button
                    className={`w-full rounded border px-3 py-2 text-left text-sm ${
                      project.id === selectedProjectId ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
                    }`}
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setSelectedPipelineId('');
                    }}
                    type="button"
                  >
                    <span className="block font-semibold">{project.name}</span>
                    <span className="line-clamp-2 text-xs text-slate-500">{project.description || 'Sem descricao'}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase text-slate-600">Pipelines</h2>
              <form className="mb-3 space-y-2" onSubmit={handleCreatePipeline}>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  disabled={!selectedProjectId}
                  required
                  value={pipelineForm.name}
                  onChange={(event) => setPipelineForm((form) => ({ ...form, name: event.target.value }))}
                />
                <button
                  className="w-full rounded bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                  disabled={!selectedProjectId || busy}
                >
                  Criar pipeline
                </button>
              </form>
              <div className="space-y-2">
                {pipelines.map((pipeline) => (
                  <button
                    className={`w-full rounded border px-3 py-2 text-left text-sm ${
                      pipeline.id === selectedPipelineId ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
                    }`}
                    key={pipeline.id}
                    onClick={() => setSelectedPipelineId(pipeline.id)}
                    type="button"
                  >
                    {pipeline.name}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <aside className="space-y-4">
            {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
            <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase text-slate-600">Agentes</h2>
              <form className="space-y-2" onSubmit={handleCreateAgent}>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  disabled={!selectedProjectId}
                  placeholder="Nome do agente"
                  required
                  value={agentForm.name}
                  onChange={(event) => setAgentForm((form) => ({ ...form, name: event.target.value }))}
                />
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  disabled={!selectedProjectId}
                  value={agentForm.agentType}
                  onChange={(event) => setAgentForm((form) => ({ ...form, agentType: event.target.value as AgentType }))}
                >
                  {AGENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  disabled={!selectedProjectId}
                  placeholder="System prompt"
                  required
                  value={agentForm.systemPrompt}
                  onChange={(event) => setAgentForm((form) => ({ ...form, systemPrompt: event.target.value }))}
                />
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  disabled={!selectedProjectId}
                  placeholder="Tools permitidas"
                  value={toolInput}
                  onChange={(event) => setToolInput(event.target.value)}
                />
                <button
                  className="w-full rounded bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                  disabled={!selectedProjectId || busy}
                >
                  Criar agente
                </button>
              </form>
              <div className="mt-4 space-y-2">
                {agents.map((agent) => (
                  <article className="rounded border border-slate-200 p-3 text-sm" key={agent.id}>
                    <p className="font-semibold">{agent.name}</p>
                    <p className="text-xs text-sky-700">{agent.agentType}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase text-slate-600">Execucao</h2>
              <textarea
                className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Contexto inicial"
                value={initialInput}
                onChange={(event) => setInitialInput(event.target.value)}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={validateCurrentPipeline} type="button">
                  Validar
                </button>
                <button
                  className="rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                  disabled={!selectedPipeline || !initialInput.trim() || busy}
                  onClick={executePipeline}
                  type="button"
                >
                  Executar
                </button>
              </div>
              {validationErrors.length > 0 ? (
                <ul className="mt-3 space-y-1 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {validationErrors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {selectedExecution ? (
                <div className="mt-3 rounded border border-slate-200 p-3 text-sm">
                  <p className="font-semibold">{selectedExecution.status}</p>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                    {selectedExecution.finalOutput || selectedExecution.errorMessage}
                  </p>
                </div>
              ) : null}
              <div className="mt-3 space-y-2">
                {executions.slice(0, 5).map((execution) => (
                  <button
                    className="w-full rounded border border-slate-200 px-3 py-2 text-left text-xs"
                    key={execution.id}
                    onClick={() => void selectExecution(execution)}
                    type="button"
                  >
                    {execution.status} - {execution.startedAt || execution.id}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedProject?.name || 'Selecione um projeto'}</h2>
                  <p className="text-sm text-slate-600">{selectedPipeline?.name || 'Crie uma pipeline para montar o fluxo.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    disabled={!agents.length}
                    value={selectedAgentToAdd}
                    onChange={(event) => setSelectedAgentToAdd(event.target.value)}
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={addAgentNode} type="button">
                    Adicionar node
                  </button>
                  <button
                    className="rounded bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                    disabled={!selectedPipeline || busy}
                    onClick={savePipeline}
                    type="button"
                  >
                    Salvar grafo
                  </button>
                </div>
              </div>
              <div className="h-[560px] overflow-hidden rounded border border-slate-200 bg-slate-50">
                <ReactFlow
                  edges={edges}
                  fitView
                  nodeTypes={nodeTypes}
                  nodes={nodes}
                  onConnect={onConnect}
                  onEdgesChange={onEdgesChange}
                  onNodesChange={onNodesChange}
                >
                  <Background />
                  <Controls />
                  <MiniMap pannable zoomable />
                </ReactFlow>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {executionSteps.map((step) => (
                <article className="rounded border border-slate-200 bg-white p-4 shadow-sm" key={step.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Step {step.stepIndex}</h3>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs">{step.status}</span>
                  </div>
                  <p className="mb-2 text-xs font-semibold text-slate-500">Input</p>
                  <p className="mb-3 whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs">{step.input}</p>
                  <p className="mb-2 text-xs font-semibold text-slate-500">Output</p>
                  <p className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs">{step.output}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </ReactFlowProvider>
  );
}

export default App;
