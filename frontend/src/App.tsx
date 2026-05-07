import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Agent,
  AgentPayload,
  AgentType,
  Project,
  createAgent,
  createProject,
  listAgents,
  listProjects,
} from './api/client';

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
  modelName: 'llama-3.1-70b-versatile',
  temperature: 0.7,
  allowedTools: [],
};

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [agentForm, setAgentForm] = useState<AgentPayload>(DEFAULT_AGENT);
  const [toolInput, setToolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
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

  const refreshAgents = useCallback(async (projectId: string) => {
    if (!projectId) {
      setAgents([]);
      return;
    }

    setError(null);
    try {
      setAgents(await listAgents(projectId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load agents');
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    void refreshAgents(selectedProjectId);
  }, [refreshAgents, selectedProjectId]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProject(true);
    setError(null);
    try {
      const project = await createProject(projectForm);
      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
      setProjectForm({ name: '', description: '' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to create project');
    } finally {
      setSavingProject(false);
    }
  }

  async function handleCreateAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }

    setSavingAgent(true);
    setError(null);
    try {
      const payload = {
        ...agentForm,
        allowedTools: toolInput
          .split(',')
          .map((tool) => tool.trim())
          .filter(Boolean),
      };
      const agent = await createAgent(selectedProjectId, payload);
      setAgents((current) => [agent, ...current]);
      setAgentForm(DEFAULT_AGENT);
      setToolInput('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to create agent');
    } finally {
      setSavingAgent(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h1 className="text-xl font-semibold">AgentFlow Studio</h1>
              <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">V1</span>
            </div>
            <form className="space-y-3" onSubmit={handleCreateProject}>
              <label className="block text-sm font-medium">
                Nome do projeto
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  maxLength={120}
                  required
                  value={projectForm.name}
                  onChange={(event) => setProjectForm((form) => ({ ...form, name: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium">
                Descricao
                <textarea
                  className="mt-1 min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={projectForm.description}
                  onChange={(event) => setProjectForm((form) => ({ ...form, description: event.target.value }))}
                />
              </label>
              <button className="w-full rounded bg-slate-950 px-3 py-2 text-sm font-semibold text-white" disabled={savingProject}>
                {savingProject ? 'Salvando...' : 'Criar projeto'}
              </button>
            </form>
          </section>

          <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Projetos</h2>
              <button className="text-sm font-medium text-sky-700" onClick={() => void refreshProjects()} type="button">
                Atualizar
              </button>
            </div>
            <div className="space-y-2">
              {loading ? <p className="text-sm text-slate-500">Carregando...</p> : null}
              {!loading && projects.length === 0 ? <p className="text-sm text-slate-500">Nenhum projeto criado.</p> : null}
              {projects.map((project) => (
                <button
                  className={`w-full rounded border px-3 py-2 text-left text-sm ${
                    project.id === selectedProjectId
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
                  <span className="block font-semibold">{project.name}</span>
                  <span className="line-clamp-2 text-xs text-slate-500">{project.description || 'Sem descricao'}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          ) : null}

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-2xl font-semibold">{selectedProject?.name || 'Selecione um projeto'}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  {selectedProject?.description || 'Crie ou selecione um projeto para configurar agentes.'}
                </p>
              </div>
              <div className="rounded border border-slate-200 px-3 py-2 text-sm">
                <span className="font-semibold">{agents.length}</span> agentes
              </div>
            </div>

            <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleCreateAgent}>
              <label className="block text-sm font-medium">
                Nome do agente
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  disabled={!selectedProjectId}
                  maxLength={120}
                  required
                  value={agentForm.name}
                  onChange={(event) => setAgentForm((form) => ({ ...form, name: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium">
                Tipo
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
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
              </label>
              <label className="block text-sm font-medium lg:col-span-2">
                Descricao
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  disabled={!selectedProjectId}
                  value={agentForm.description}
                  onChange={(event) => setAgentForm((form) => ({ ...form, description: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium lg:col-span-2">
                System prompt
                <textarea
                  className="mt-1 min-h-28 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  disabled={!selectedProjectId}
                  required
                  value={agentForm.systemPrompt}
                  onChange={(event) => setAgentForm((form) => ({ ...form, systemPrompt: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium">
                Modelo
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  disabled={!selectedProjectId}
                  required
                  value={agentForm.modelName}
                  onChange={(event) => setAgentForm((form) => ({ ...form, modelName: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium">
                Temperatura
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  disabled={!selectedProjectId}
                  max={2}
                  min={0}
                  step={0.1}
                  type="number"
                  value={agentForm.temperature}
                  onChange={(event) =>
                    setAgentForm((form) => ({ ...form, temperature: Number(event.target.value) }))
                  }
                />
              </label>
              <label className="block text-sm font-medium lg:col-span-2">
                Tools permitidas
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  disabled={!selectedProjectId}
                  placeholder="search, docs, local-files"
                  value={toolInput}
                  onChange={(event) => setToolInput(event.target.value)}
                />
              </label>
              <div className="lg:col-span-2">
                <button
                  className="rounded bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={!selectedProjectId || savingAgent}
                >
                  {savingAgent ? 'Salvando...' : 'Criar agente'}
                </button>
              </div>
            </form>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {agents.map((agent) => (
              <article className="rounded border border-slate-200 bg-white p-4 shadow-sm" key={agent.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-xs font-medium text-sky-700">{agent.agentType}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">{agent.modelProvider}</span>
                </div>
                <p className="mb-3 text-sm text-slate-600">{agent.description || 'Sem descricao'}</p>
                <p className="line-clamp-3 rounded bg-slate-50 p-3 text-xs text-slate-700">{agent.systemPrompt}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded border border-slate-200 px-2 py-1">{agent.modelName}</span>
                  <span className="rounded border border-slate-200 px-2 py-1">temp {agent.temperature}</span>
                  {agent.allowedTools.map((tool) => (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800" key={tool}>
                      {tool}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
