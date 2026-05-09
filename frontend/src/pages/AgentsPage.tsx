import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Agent, AgentPayload, Project, createAgent, deleteAgent, updateAgent } from '../api/client';
import { AGENT_TYPES, AVAILABLE_TOOLS, DEFAULT_AGENT, GROQ_MODELS, GroqModelId } from '../constants/agents';

type AgentsPageProps = {
  selectedProject: Project | null;
  agents: Agent[];
  busy: boolean;
  editAgentId: string;
  onBusyChange: (busy: boolean) => void;
  onAgentsChanged: () => Promise<void>;
  onEditAgentRequestConsumed: () => void;
  onError: (message: string | null) => void;
};

function toDraft(agent: Agent): AgentPayload {
  return {
    name: agent.name,
    description: agent.description || '',
    systemPrompt: agent.systemPrompt,
    agentType: agent.agentType,
    modelProvider: agent.modelProvider,
    modelName: agent.modelName,
    temperature: agent.temperature,
    allowedTools: agent.allowedTools,
  };
}

function AgentsPage({
  selectedProject,
  agents,
  busy,
  editAgentId,
  onBusyChange,
  onAgentsChanged,
  onEditAgentRequestConsumed,
  onError,
}: AgentsPageProps) {
  const [draft, setDraft] = useState<AgentPayload>(DEFAULT_AGENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  );

  function resetForm() {
    setEditingId(null);
    setDraft(DEFAULT_AGENT);
  }

  useEffect(() => {
    setSelectedAgentId('');
    resetForm();
  }, [selectedProject?.id]);

  function startEdit(agent: Agent) {
    setEditingId(agent.id);
    setSelectedAgentId(agent.id);
    setDraft(toDraft(agent));
  }

  useEffect(() => {
    if (!editAgentId) {
      return;
    }
    const agent = agents.find((item) => item.id === editAgentId);
    if (!agent) {
      return;
    }
    startEdit(agent);
    onEditAgentRequestConsumed();
  }, [agents, editAgentId, onEditAgentRequestConsumed]);

  function toggleTool(toolName: string) {
    setDraft((current) => {
      const hasTool = current.allowedTools.includes(toolName);
      return {
        ...current,
        allowedTools: hasTool
          ? current.allowedTools.filter((tool) => tool !== toolName)
          : [...current.allowedTools, toolName],
      };
    });
  }

  const draftModelIsListed = GROQ_MODELS.some((model) => model.id === draft.modelName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    onBusyChange(true);
    onError(null);
    try {
      if (editingId) {
        await updateAgent(selectedProject.id, editingId, draft);
        setSelectedAgentId(editingId);
      } else {
        const created = await createAgent(selectedProject.id, draft);
        setSelectedAgentId(created.id);
      }
      resetForm();
      await onAgentsChanged();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao salvar agente');
    } finally {
      onBusyChange(false);
    }
  }

  async function handleDelete(agent: Agent) {
    if (!selectedProject || !window.confirm(`Deletar o agente "${agent.name}"?`)) {
      return;
    }
    onBusyChange(true);
    onError(null);
    try {
      await deleteAgent(selectedProject.id, agent.id);
      if (selectedAgentId === agent.id) {
        setSelectedAgentId('');
      }
      if (editingId === agent.id) {
        resetForm();
      }
      await onAgentsChanged();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao deletar agente');
    } finally {
      onBusyChange(false);
    }
  }

  if (!selectedProject) {
    return (
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Agentes</h2>
        <p className="mt-2 text-sm text-slate-600">Selecione ou crie um projeto antes de configurar agentes.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[460px_1fr]">
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{editingId ? 'Editar agente' : 'Criar agente'}</h2>
        <p className="mt-1 text-sm text-slate-500">{selectedProject.name}</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              maxLength={120}
              required
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Descricao operacional</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Tipo</span>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={draft.agentType}
                onChange={(event) => setDraft((current) => ({ ...current, agentType: event.target.value as AgentPayload['agentType'] }))}
              >
                {AGENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Temperatura</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                max="1"
                min="0"
                step="0.05"
                type="number"
                value={draft.temperature}
                onChange={(event) => setDraft((current) => ({ ...current, temperature: Number(event.target.value) }))}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Modelo</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
              value={draft.modelName}
              onChange={(event) => setDraft((current) => ({ ...current, modelName: event.target.value as GroqModelId }))}
            >
              {!draftModelIsListed && draft.modelName ? (
                <option value={draft.modelName}>{draft.modelName} (modelo salvo fora da lista)</option>
              ) : null}
              {GROQ_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">System prompt</span>
            <textarea
              className="mt-1 min-h-40 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
              value={draft.systemPrompt}
              onChange={(event) => setDraft((current) => ({ ...current, systemPrompt: event.target.value }))}
            />
          </label>
          <fieldset className="rounded border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-700">Tools permitidas</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <label className="flex items-center gap-2 text-sm" key={tool.id}>
                  <input checked={draft.allowedTools.includes(tool.id)} type="checkbox" onChange={() => toggleTool(tool.id)} />
                  <span>{tool.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={busy}>
              {editingId ? 'Salvar alteracoes' : 'Criar agente'}
            </button>
            {editingId ? (
              <button className="rounded border border-slate-300 px-4 py-2 text-sm" onClick={resetForm} type="button">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="space-y-3">
          {agents.map((agent) => (
            <button
              className={`w-full rounded border p-4 text-left shadow-sm ${
                selectedAgent?.id === agent.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
              }`}
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              type="button"
            >
              <span className="block font-semibold">{agent.name}</span>
              <span className="mt-1 block text-xs font-medium text-sky-700">{agent.agentType}</span>
              <span className="mt-2 line-clamp-2 block text-sm text-slate-600">{agent.description || 'Sem descricao'}</span>
            </button>
          ))}
        </div>

        <article className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          {selectedAgent ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedAgent.name}</h2>
                  <p className="mt-1 text-sm font-medium text-sky-700">{selectedAgent.agentType}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => startEdit(selectedAgent)} type="button">
                    Editar
                  </button>
                  <button
                    className="rounded border border-red-200 px-3 py-2 text-sm text-red-700"
                    onClick={() => void handleDelete(selectedAgent)}
                    type="button"
                  >
                    Deletar
                  </button>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">Provider</dt>
                  <dd className="mt-1 text-sm">{selectedAgent.modelProvider}</dd>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">Modelo</dt>
                  <dd className="mt-1 break-words text-sm">{selectedAgent.modelName}</dd>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">Temperatura</dt>
                  <dd className="mt-1 text-sm">{selectedAgent.temperature}</dd>
                </div>
              </dl>
              <section className="mt-5">
                <h3 className="text-sm font-semibold text-slate-500">O que este agente faz</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedAgent.description || 'Sem descricao operacional definida.'}
                </p>
              </section>
              <section className="mt-5">
                <h3 className="text-sm font-semibold text-slate-500">System prompt</h3>
                <p className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedAgent.systemPrompt}
                </p>
              </section>
              <section className="mt-5">
                <h3 className="text-sm font-semibold text-slate-500">Tools</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAgent.allowedTools.length ? (
                    selectedAgent.allowedTools.map((tool) => (
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800" key={tool}>
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Nenhuma tool permitida.</span>
                  )}
                </div>
              </section>
            </>
          ) : (
            <p className="text-sm text-slate-600">Crie um agente para ver seus detalhes.</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default AgentsPage;
