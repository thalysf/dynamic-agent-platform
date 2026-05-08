import { useEffect, useMemo, useState } from 'react';
import { Edge } from '@xyflow/react';

import {
  Agent,
  Execution,
  ExecutionStep,
  Pipeline,
  Project,
  listExecutionSteps,
  runPipeline,
  validatePipeline,
} from '../api/client';
import { parseFlow } from '../flows/flowUtils';
import { AgentNode } from '../flows/types';

type PlaygroundPageProps = {
  selectedProject: Project | null;
  selectedPipeline: Pipeline | null;
  pipelines: Pipeline[];
  agents: Agent[];
  executions: Execution[];
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSelectPipeline: (pipelineId: string) => void;
  onExecutionsChanged: () => Promise<void>;
  onError: (message: string | null) => void;
};

type LiveStatus = 'pending' | 'running' | 'completed' | 'failed';

type LiveStep = {
  id: string;
  index: number;
  nodeId: string;
  agentId: string | null;
  label: string;
  description: string;
  status: LiveStatus;
};

function orderNodes(nodes: AgentNode[], edges: Edge[]): AgentNode[] {
  if (!nodes.length) {
    return [];
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));

  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      continue;
    }
    outgoing.get(edge.source)?.push(edge.target);
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const ordered: AgentNode[] = [];

  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    ordered.push(node);
    for (const target of outgoing.get(node.id) ?? []) {
      const nextIncoming = (incoming.get(target) ?? 0) - 1;
      incoming.set(target, nextIncoming);
      if (nextIncoming === 0) {
        const targetNode = nodeById.get(target);
        if (targetNode) {
          queue.push(targetNode);
        }
      }
    }
  }

  return ordered.length === nodes.length ? ordered : nodes;
}

function buildLiveSteps(pipeline: Pipeline | null, agents: Agent[]): LiveStep[] {
  if (!pipeline) {
    return [];
  }
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const nodes = parseFlow<AgentNode[]>(pipeline.nodesJson, []);
  const edges = parseFlow<Edge[]>(pipeline.edgesJson, []);

  return orderNodes(nodes, edges).map((node, index) => {
    const agent = agentById.get(node.data.agentId);
    return {
      id: node.id,
      index: index + 1,
      nodeId: node.id,
      agentId: node.data.agentId,
      label: agent?.name || node.data.label || `Step ${index + 1}`,
      description: agent?.description || agent?.systemPrompt || 'Agente em execucao.',
      status: index === 0 ? 'running' : 'pending',
    };
  });
}

function nextLiveSteps(current: LiveStep[]): LiveStep[] {
  const runningIndex = current.findIndex((step) => step.status === 'running');
  if (runningIndex === -1) {
    return current;
  }

  return current.map((step, index) => {
    if (index < runningIndex) {
      return { ...step, status: 'completed' };
    }
    if (index === runningIndex) {
      return { ...step, status: 'completed' };
    }
    if (index === runningIndex + 1) {
      return { ...step, status: 'running' };
    }
    return { ...step, status: 'pending' };
  });
}

function statusLabel(status: LiveStatus | Execution['status']) {
  const labels = {
    pending: 'Na fila',
    running: 'Executando',
    completed: 'Concluido',
    failed: 'Falhou',
    PENDING: 'Na fila',
    RUNNING: 'Executando',
    COMPLETED: 'Concluido',
    FAILED: 'Falhou',
    CANCELLED: 'Cancelado',
  };
  return labels[status];
}

function statusClass(status: LiveStatus | Execution['status']) {
  if (status === 'running' || status === 'RUNNING') {
    return 'border-sky-300 bg-sky-50 text-sky-800';
  }
  if (status === 'completed' || status === 'COMPLETED') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  }
  if (status === 'failed' || status === 'FAILED') {
    return 'border-red-300 bg-red-50 text-red-800';
  }
  return 'border-slate-300 bg-slate-50 text-slate-700';
}

function prettyJson(value: string | null) {
  if (!value) {
    return '';
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function PlaygroundPage({
  selectedProject,
  selectedPipeline,
  pipelines,
  agents,
  executions,
  busy,
  onBusyChange,
  onSelectPipeline,
  onExecutionsChanged,
  onError,
}: PlaygroundPageProps) {
  const [initialInput, setInitialInput] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [liveSteps, setLiveSteps] = useState<LiveStep[]>([]);
  const [liveMode, setLiveMode] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

  const pipelinePlan = useMemo(() => buildLiveSteps(selectedPipeline, agents), [agents, selectedPipeline]);
  const completedCount = liveSteps.filter((step) => step.status === 'completed').length;
  const progressPercent = liveSteps.length ? Math.round((completedCount / liveSteps.length) * 100) : 0;

  useEffect(() => {
    setSelectedExecution(null);
    setSteps([]);
    setValidationErrors([]);
    setLiveSteps(pipelinePlan.map((step) => ({ ...step, status: 'pending' })));
    setLiveMode('idle');
  }, [pipelinePlan, selectedPipeline?.id]);

  useEffect(() => {
    if (liveMode !== 'running') {
      return;
    }
    const timer = window.setInterval(() => {
      setLiveSteps((current) => nextLiveSteps(current));
    }, 900);
    return () => window.clearInterval(timer);
  }, [liveMode]);

  async function loadSteps(execution: Execution) {
    setSelectedExecution(execution);
    setSteps(await listExecutionSteps(execution.id));
    setLiveMode('idle');
    setLiveSteps(pipelinePlan.map((step) => ({ ...step, status: execution.status === 'COMPLETED' ? 'completed' : 'pending' })));
  }

  async function executePipeline() {
    if (!selectedProject || !selectedPipeline || !initialInput.trim()) {
      return;
    }
    onBusyChange(true);
    onError(null);
    setSelectedExecution(null);
    setSteps([]);
    setLiveSteps(pipelinePlan);
    setLiveMode('running');
    try {
      const validation = await validatePipeline(selectedProject.id, selectedPipeline.id);
      setValidationErrors(validation.errors);
      if (!validation.valid) {
        setLiveMode('failed');
        setLiveSteps((current) => current.map((step, index) => ({ ...step, status: index === 0 ? 'failed' : 'pending' })));
        return;
      }
      const execution = await runPipeline(selectedProject.id, selectedPipeline.id, initialInput);
      await onExecutionsChanged();
      const executionSteps = await listExecutionSteps(execution.id);
      setSelectedExecution(execution);
      setSteps(executionSteps);
      setLiveMode(execution.status === 'COMPLETED' ? 'completed' : 'failed');
      setLiveSteps((current) =>
        current.map((step) => ({ ...step, status: execution.status === 'COMPLETED' ? 'completed' : 'failed' })),
      );
    } catch (reason) {
      setLiveMode('failed');
      setLiveSteps((current) => current.map((step) => (step.status === 'running' ? { ...step, status: 'failed' } : step)));
      onError(reason instanceof Error ? reason.message : 'Falha ao executar pipeline');
    } finally {
      onBusyChange(false);
    }
  }

  if (!selectedProject) {
    return (
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Playground</h2>
        <p className="mt-2 text-sm text-slate-600">Selecione um projeto para testar pipelines prontos.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <aside className="space-y-4">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Executar pipeline</h2>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Pipeline</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={selectedPipeline?.id || ''}
              onChange={(event) => onSelectPipeline(event.target.value)}
            >
              <option value="">Selecione uma pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Input inicial</span>
            <textarea
              className="mt-1 min-h-40 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={initialInput}
              onChange={(event) => setInitialInput(event.target.value)}
            />
          </label>
          <button
            className="mt-4 w-full rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            disabled={!selectedPipeline || !initialInput.trim() || busy}
            onClick={executePipeline}
            type="button"
          >
            {busy ? 'Executando' : 'Executar'}
          </button>
          {validationErrors.length ? (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Historico</h2>
          <div className="mt-4 space-y-2">
            {executions.map((execution) => (
              <button
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedExecution?.id === execution.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
                }`}
                key={execution.id}
                onClick={() => void loadSteps(execution)}
                type="button"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{statusLabel(execution.status)}</span>
                  <span className={`rounded border px-2 py-0.5 text-xs ${statusClass(execution.status)}`}>{execution.status}</span>
                </span>
                <span className="mt-1 block text-xs text-slate-500">{execution.startedAt || execution.id}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <article className="execution-stage rounded border border-slate-200 p-5 text-white shadow-sm">
          <div className="relative z-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-cyan-200">Pipeline runtime</p>
                <h2 className="mt-1 text-2xl font-semibold">{selectedPipeline?.name || 'Nenhuma pipeline selecionada'}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                  {liveMode === 'running'
                    ? 'Acompanhe a esteira de agentes enquanto o orchestrator processa a execucao.'
                    : 'Execute uma pipeline para ver cada agente entrar em acao e depois confira os traces reais.'}
                </p>
              </div>
              <div className={`w-fit rounded border px-3 py-2 text-sm font-semibold ${statusClass(liveMode === 'idle' ? 'pending' : liveMode)}`}>
                {statusLabel(liveMode === 'idle' ? 'pending' : liveMode)}
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded bg-slate-800">
              <div className="h-full rounded bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {(liveSteps.length ? liveSteps : pipelinePlan).map((step) => (
                <article className={`execution-step-card ${step.status}`} key={step.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Step {step.index}</p>
                      <h3 className="mt-1 font-semibold text-white">{step.label}</h3>
                    </div>
                    <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClass(step.status)}`}>{statusLabel(step.status)}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{step.description}</p>
                  {step.status === 'running' ? (
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-cyan-200">
                      <span className="execution-pulse" />
                      Processando contexto, tools e resposta do agente
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Resultado</h2>
          {selectedExecution ? (
            <div className="mt-4 rounded border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">{statusLabel(selectedExecution.status)}</p>
                <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClass(selectedExecution.status)}`}>
                  {selectedExecution.status}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selectedExecution.finalOutput || selectedExecution.errorMessage || 'Sem output final.'}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Escolha uma pipeline pronta e execute um input para inspecionar a resposta.</p>
          )}
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          {steps.map((step) => (
            <article className="rounded border border-slate-200 bg-white p-5 shadow-sm" key={step.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Step {step.stepIndex}</p>
                  <h3 className="mt-1 font-semibold">{step.nodeId || step.agentId}</h3>
                </div>
                <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClass(step.status)}`}>{statusLabel(step.status)}</span>
              </div>
              <div className="mt-4 grid gap-4">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Input recebido</h4>
                  <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                    {step.input || 'Sem input registrado.'}
                  </p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Output produzido</h4>
                  <p className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-emerald-50 p-3 text-xs leading-5 text-slate-800">
                    {step.output || step.errorMessage || 'Sem output registrado.'}
                  </p>
                </section>
                {step.toolCalls ? (
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-slate-500">Tool calls</h4>
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                      {prettyJson(step.toolCalls)}
                    </pre>
                  </section>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PlaygroundPage;
