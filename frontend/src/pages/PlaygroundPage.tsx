import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Edge as FlowEdge,
  Handle,
  MiniMap,
  MiniMapNodeProps,
  Node as FlowNode,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
  onEditAgent: (agentId: string) => void;
  onExecutionsChanged: () => Promise<void>;
  onError: (message: string | null) => void;
};

type LiveStatus = 'pending' | 'running' | 'completed' | 'failed';

type LiveStep = {
  id: string;
  index: number;
  level: number;
  row: number;
  x: number;
  y: number;
  nodeId: string;
  agentId: string | null;
  label: string;
  description: string;
  systemPrompt: string;
  status: LiveStatus;
};

type LiveEdge = {
  id: string;
  source: string;
  target: string;
};

type GraphPlan = {
  nodes: LiveStep[];
  edges: LiveEdge[];
};

type RuntimeNodeData = {
  index: number;
  agentId: string | null;
  label: string;
  description: string;
  systemPrompt: string;
  status: LiveStatus;
  activity: string;
};

type RuntimeNode = FlowNode<RuntimeNodeData, 'runtime'>;
type RuntimeEdge = FlowEdge;
type MiniMapStep = Pick<RuntimeNodeData, 'index' | 'label' | 'status'>;
type ToolCall = {
  toolName?: string;
  status?: string;
  result?: {
    publicUrl?: string;
    path?: string;
    absolutePath?: string;
    mimeType?: string;
  };
  error?: string;
};
type ImagePreview = {
  url: string;
  title: string;
  path: string;
};
type StepDetailPreview = {
  step: ExecutionStep;
  status: Execution['status'];
  toolCalls: ToolCall[];
};

const EMPTY_GRAPH_PLAN: GraphPlan = {
  nodes: [],
  edges: [],
};

const ACTIVITY_MESSAGES = [
  'recebendo contexto de entrada',
  'preparando prompt e memoria curta',
  'checando tools permitidas',
  'gerando resposta do agente',
  'enviando contexto para os proximos steps',
];

const GRAPH_NODE_WIDTH = 240;
const GRAPH_NODE_HEIGHT = 214;
const GRAPH_COLUMN_GAP = 360;
const GRAPH_ROW_GAP = 130;
const MiniMapStepContext = createContext<Map<string, MiniMapStep>>(new Map());

function compactMiniMapLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 17)}...` : value;
}

function RuntimeNodeView({ data }: NodeProps<RuntimeNode>) {
  return (
    <div className={`runtime-node-card ${data.status}`}>
      <Handle className="runtime-handle" type="target" position={Position.Left} />
      {data.status === 'running' ? <div className="runtime-node-bubble">Etapa {data.index} esta {data.activity}</div> : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Step {data.index}</p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-white">{data.label}</h3>
        </div>
        <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClass(data.status)}`}>{statusLabel(data.status)}</span>
      </div>
      {data.systemPrompt ? (
        <div className="runtime-prompt-preview" tabIndex={0}>
          <p className="runtime-prompt-text">{data.systemPrompt}</p>
          <div className="runtime-prompt-popover" role="tooltip">
            {data.systemPrompt}
          </div>
        </div>
      ) : (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{data.description}</p>
      )}
      <Handle className="runtime-handle" type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  runtime: RuntimeNodeView,
};

function RuntimeMiniMapNode({
  id,
  x,
  y,
  width,
  height,
  borderRadius,
  color,
  strokeColor,
  strokeWidth,
  className,
  shapeRendering,
  selected,
  onClick,
}: MiniMapNodeProps) {
  const steps = useContext(MiniMapStepContext);
  const step = steps.get(id);
  const fill = color ?? '#475569';
  const stroke = selected ? '#ecfeff' : (strokeColor ?? 'rgba(219, 234, 254, 0.72)');
  const title = step ? `Step ${step.index} - ${step.label}` : id;

  return (
    <g className={className} onClick={(event) => onClick?.(event, id)}>
      <title>{title}</title>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={borderRadius}
        ry={borderRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 5 : strokeWidth}
        shapeRendering={shapeRendering}
      />
      {step ? (
        <>
          <text
            x={x + 14}
            y={y + 42}
            fill="#ecfeff"
            fontFamily="Inter, ui-sans-serif, system-ui"
            fontSize="28"
            fontWeight="700"
            pointerEvents="none"
          >
            Step {step.index}
          </text>
          <text
            x={x + 14}
            y={y + 78}
            fill="rgba(236, 254, 255, 0.88)"
            fontFamily="Inter, ui-sans-serif, system-ui"
            fontSize="24"
            fontWeight="600"
            pointerEvents="none"
          >
            {compactMiniMapLabel(step.label)}
          </text>
        </>
      ) : null}
    </g>
  );
}

function levelNodes(nodes: AgentNode[], edges: FlowEdge[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  const levels = new Map(nodes.map((node) => [node.id, 0]));

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
      levels.set(target, Math.max(levels.get(target) ?? 0, (levels.get(node.id) ?? 0) + 1));
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

  const source = ordered.length === nodes.length ? ordered : nodes;
  return source.map((node) => ({ node, level: levels.get(node.id) ?? 0 }));
}

function buildGraphPlan(pipeline: Pipeline | null, agents: Agent[]): GraphPlan {
  if (!pipeline) {
    return EMPTY_GRAPH_PLAN;
  }

  const parsedNodes = parseFlow<AgentNode[]>(pipeline.nodesJson, []);
  const parsedEdges = parseFlow<FlowEdge[]>(pipeline.edgesJson, []);
  const nodeIds = new Set(parsedNodes.map((node) => node.id));
  const validEdges = parsedEdges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const leveledNodes = levelNodes(parsedNodes, validEdges);
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const grouped = new Map<number, Array<{ node: AgentNode; level: number }>>();

  for (const item of leveledNodes) {
    grouped.set(item.level, [...(grouped.get(item.level) ?? []), item]);
  }

  const maxRows = Math.max(1, ...Array.from(grouped.values()).map((group) => group.length));
  const rowSpacing = GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP;

  const liveNodes = leveledNodes.map((item, index) => {
    const agent = agentById.get(item.node.data.agentId);
    const siblings = grouped.get(item.level) ?? [];
    const row = Math.max(0, siblings.findIndex((sibling) => sibling.node.id === item.node.id));
    const x = item.level * GRAPH_COLUMN_GAP;
    const groupOffset = ((maxRows - siblings.length) * rowSpacing) / 2;
    const y = groupOffset + row * rowSpacing;
    const status: LiveStatus = item.level === 0 ? 'running' : 'pending';

    return {
      id: item.node.id,
      index: index + 1,
      level: item.level,
      row,
      x,
      y,
      nodeId: item.node.id,
      agentId: item.node.data.agentId,
      label: agent?.name || item.node.data.label || `Step ${index + 1}`,
      description: agent?.description || agent?.systemPrompt || 'Agente em execucao.',
      systemPrompt: agent?.systemPrompt || '',
      status,
    };
  });

  return {
    nodes: liveNodes,
    edges: validEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

function resetGraphSteps(plan: GraphPlan, status: LiveStatus = 'pending'): LiveStep[] {
  return plan.nodes.map((step) => ({ ...step, status }));
}

function startGraphSteps(plan: GraphPlan): LiveStep[] {
  return plan.nodes.map((step) => ({
    ...step,
    status: (step.level === 0 ? 'running' : 'pending') as LiveStatus,
  }));
}

function nextGraphSteps(current: LiveStep[]): LiveStep[] {
  const runningLevels = current.filter((step) => step.status === 'running').map((step) => step.level);
  if (!runningLevels.length) {
    return current;
  }

  const runningLevel = Math.min(...runningLevels);
  const maxLevel = Math.max(...current.map((step) => step.level));
  if (runningLevel >= maxLevel) {
    return current;
  }

  return current.map((step) => {
    if (step.level <= runningLevel) {
      return { ...step, status: 'completed' };
    }
    if (step.level === runningLevel + 1) {
      return { ...step, status: 'running' };
    }
    return { ...step, status: 'pending' };
  });
}

function liveEdgeState(edge: LiveEdge, steps: LiveStep[]) {
  const source = steps.find((step) => step.id === edge.source);
  const target = steps.find((step) => step.id === edge.target);
  if (!source || !target) {
    return 'pending';
  }
  if (source.status === 'failed' || target.status === 'failed') {
    return 'failed';
  }
  if (source.status === 'completed' && target.status === 'completed') {
    return 'completed';
  }
  if (source.status === 'completed' && target.status === 'running') {
    return 'active';
  }
  return 'pending';
}

function edgeColor(state: string) {
  if (state === 'active') {
    return '#10b981';
  }
  if (state === 'completed') {
    return 'rgba(16, 185, 129, 0.78)';
  }
  if (state === 'failed') {
    return 'rgba(248, 113, 113, 0.9)';
  }
  return 'rgba(148, 163, 184, 0.36)';
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

function parseToolCalls(value: string | null): ToolCall[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function imageToolCalls(value: string | null): ToolCall[] {
  return parseToolCalls(value).filter(
    (call) => call.toolName === 'image_generate' && call.status === 'COMPLETED' && call.result?.publicUrl,
  );
}

function hasFailedToolCalls(value: string | null) {
  return parseToolCalls(value).some((call) => call.status === 'FAILED');
}

function effectiveStepStatus(step: ExecutionStep): Execution['status'] {
  if (step.status === 'FAILED' || hasFailedToolCalls(step.toolCalls)) {
    return 'FAILED';
  }
  return step.status;
}

function graphStatusFromExecution(status: Execution['status']): LiveStatus {
  if (status === 'FAILED' || status === 'CANCELLED') {
    return 'failed';
  }
  if (status === 'COMPLETED') {
    return 'completed';
  }
  if (status === 'RUNNING') {
    return 'running';
  }
  return 'pending';
}

function graphStatusFromStepStatus(status: Execution['status']): LiveStatus {
  if (status === 'FAILED' || status === 'CANCELLED') {
    return 'failed';
  }
  if (status === 'COMPLETED') {
    return 'completed';
  }
  if (status === 'RUNNING') {
    return 'running';
  }
  return 'pending';
}

function stepsFromExecution(plan: GraphPlan, execution: Execution, executionSteps: ExecutionStep[]): LiveStep[] {
  const byNodeId = new Map(executionSteps.filter((step) => step.nodeId).map((step) => [step.nodeId, effectiveStepStatus(step)]));
  const fallbackStatus = graphStatusFromExecution(execution.status);
  return plan.nodes.map((step) => ({
    ...step,
    status: byNodeId.has(step.nodeId) ? graphStatusFromStepStatus(byNodeId.get(step.nodeId) ?? 'PENDING') : fallbackStatus,
  }));
}

function RuntimeFlow({
  graphPlan,
  liveSteps,
  activityTick,
  onEditAgent,
}: {
  graphPlan: GraphPlan;
  liveSteps: LiveStep[];
  activityTick: number;
  onEditAgent: (agentId: string) => void;
}) {
  const { fitView } = useReactFlow<RuntimeNode, RuntimeEdge>();
  const displayedSteps = liveSteps.length ? liveSteps : resetGraphSteps(graphPlan);

  const nodes = useMemo<RuntimeNode[]>(
    () =>
      displayedSteps.map((step) => ({
        id: step.id,
        type: 'runtime',
        position: { x: step.x, y: step.y },
        width: GRAPH_NODE_WIDTH,
        height: GRAPH_NODE_HEIGHT,
        draggable: false,
        data: {
          index: step.index,
          agentId: step.agentId,
          label: step.label,
          description: step.description,
          systemPrompt: step.systemPrompt,
          status: step.status,
          activity: ACTIVITY_MESSAGES[(activityTick + step.level + step.row) % ACTIVITY_MESSAGES.length],
        },
      })),
    [activityTick, displayedSteps],
  );

  const edges = useMemo<RuntimeEdge[]>(
    () =>
      graphPlan.edges.map((edge) => {
        const state = liveEdgeState(edge, displayedSteps);
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: state === 'active',
          className: `runtime-edge ${state}`,
          style: { stroke: edgeColor(state), strokeWidth: state === 'active' ? 3 : 2 },
        };
      }),
    [displayedSteps, graphPlan.edges],
  );

  const activeNodeIds = useMemo(() => displayedSteps.filter((step) => step.status === 'running').map((step) => step.id), [displayedSteps]);
  const miniMapSteps = useMemo(
    () => new Map(displayedSteps.map((step) => [step.id, { index: step.index, label: step.label, status: step.status }])),
    [displayedSteps],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const targetNodes = activeNodeIds.length ? activeNodeIds.map((id) => ({ id })) : undefined;
      void fitView({
        nodes: targetNodes,
        padding: activeNodeIds.length ? 0.75 : 0.25,
        duration: 500,
        minZoom: 0.45,
        maxZoom: 1.05,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeNodeIds, fitView, nodes.length]);

  return (
    <div className="runtime-flow">
      <ReactFlow
        edges={edges}
        fitView
        maxZoom={1.4}
        minZoom={0.25}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesDraggable={false}
        onNodeClick={(_, node) => {
          if (node.data.agentId) {
            onEditAgent(node.data.agentId);
          }
        }}
        panOnDrag
        panOnScroll
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
        zoomOnPinch
        zoomOnScroll
      >
        <Background color="rgba(148, 163, 184, 0.18)" gap={28} />
        <Controls />
        <MiniMapStepContext.Provider value={miniMapSteps}>
          <MiniMap
            ariaLabel="Mapa resumido da pipeline em execucao"
            bgColor="rgba(2, 6, 23, 0.88)"
            maskColor="rgba(15, 23, 42, 0.44)"
            maskStrokeColor="rgba(219, 234, 254, 0.28)"
            nodeBorderRadius={8}
            nodeColor={(node) => {
              const status = (node.data as RuntimeNodeData | undefined)?.status;
              if (status === 'running') {
                return '#5eead4';
              }
              if (status === 'completed') {
                return '#34d399';
              }
              if (status === 'failed') {
                return '#f87171';
              }
              return '#475569';
            }}
            nodeComponent={RuntimeMiniMapNode}
            nodeStrokeColor="#ccfbf1"
            nodeStrokeWidth={3}
            pannable
            zoomable
          />
        </MiniMapStepContext.Provider>
      </ReactFlow>
    </div>
  );
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
  onEditAgent,
  onExecutionsChanged,
  onError,
}: PlaygroundPageProps) {
  const [initialInput, setInitialInput] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [liveSteps, setLiveSteps] = useState<LiveStep[]>([]);
  const [liveMode, setLiveMode] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [activityTick, setActivityTick] = useState(0);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [stepDetailPreview, setStepDetailPreview] = useState<StepDetailPreview | null>(null);

  const graphPlan = useMemo(() => buildGraphPlan(selectedPipeline, agents), [agents, selectedPipeline]);
  const completedCount = liveSteps.filter((step) => step.status === 'completed').length;
  const progressPercent = liveSteps.length ? Math.round((completedCount / liveSteps.length) * 100) : 0;

  useEffect(() => {
    setSelectedExecution(null);
    setSteps([]);
    setValidationErrors([]);
    setLiveSteps(resetGraphSteps(graphPlan));
    setLiveMode('idle');
    setActivityTick(0);
  }, [graphPlan, selectedPipeline?.id]);

  useEffect(() => {
    if (liveMode !== 'running') {
      return;
    }
    const timer = window.setInterval(() => {
      setLiveSteps((current) => nextGraphSteps(current));
      setActivityTick((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [liveMode]);

  async function loadSteps(execution: Execution) {
    const executionSteps = await listExecutionSteps(execution.id);
    setSelectedExecution(execution);
    setSteps(executionSteps);
    setLiveMode('idle');
    setLiveSteps(stepsFromExecution(graphPlan, execution, executionSteps));
  }

  async function executePipeline() {
    if (!selectedProject || !selectedPipeline || !initialInput.trim()) {
      return;
    }
    onBusyChange(true);
    onError(null);
    setSelectedExecution(null);
    setSteps([]);
    setActivityTick(0);
    setLiveSteps(startGraphSteps(graphPlan));
    setLiveMode('running');
    try {
      const validation = await validatePipeline(selectedProject.id, selectedPipeline.id);
      setValidationErrors(validation.errors);
      if (!validation.valid) {
        setLiveMode('failed');
        setLiveSteps((current) =>
          current.map((step) => ({ ...step, status: (step.level === 0 ? 'failed' : 'pending') as LiveStatus })),
        );
        return;
      }
      const execution = await runPipeline(selectedProject.id, selectedPipeline.id, initialInput);
      await onExecutionsChanged();
      const executionSteps = await listExecutionSteps(execution.id);
      const hasFailedStep = executionSteps.some((step) => effectiveStepStatus(step) === 'FAILED');
      setSelectedExecution(execution);
      setSteps(executionSteps);
      setLiveMode(execution.status === 'COMPLETED' && !hasFailedStep ? 'completed' : 'failed');
      setLiveSteps(stepsFromExecution(graphPlan, execution, executionSteps));
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
    <>
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
                    ? 'Acompanhe dependencias, branches paralelos e o step ativo da execucao.'
                    : 'Execute uma pipeline para ver o grafo em movimento e depois conferir os traces reais.'}
                </p>
              </div>
              <div className={`w-fit rounded border px-3 py-2 text-sm font-semibold ${statusClass(liveMode === 'idle' ? 'pending' : liveMode)}`}>
                {statusLabel(liveMode === 'idle' ? 'pending' : liveMode)}
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded bg-slate-800">
              <div className="h-full rounded bg-gradient-to-r from-sky-900 to-emerald-400 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mt-5 overflow-hidden rounded border border-slate-700/40">
              <ReactFlowProvider>
                <RuntimeFlow activityTick={activityTick} graphPlan={graphPlan} liveSteps={liveSteps} onEditAgent={onEditAgent} />
              </ReactFlowProvider>
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
          {steps.map((step) => {
            const stepStatus = effectiveStepStatus(step);
            const toolCalls = parseToolCalls(step.toolCalls);
            const images = imageToolCalls(step.toolCalls);
            return (
            <article className={`trace-card ${stepStatus === 'FAILED' ? 'failed' : ''}`} key={step.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-slate-500">Step {step.stepIndex}</p>
                  <h3 className="mt-1 break-words font-semibold">{step.nodeId || step.agentId}</h3>
                </div>
                <span className={`shrink-0 rounded border px-2 py-1 text-xs font-medium ${statusClass(stepStatus)}`}>{statusLabel(stepStatus)}</span>
              </div>
              <div className="mt-4 grid gap-4">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Input recebido</h4>
                  <p className="trace-preview input">
                    {step.input || 'Sem input registrado.'}
                  </p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Output produzido</h4>
                  <button
                    className={`trace-preview output ${stepStatus === 'FAILED' ? 'failed' : ''}`}
                    onClick={() => setStepDetailPreview({ step, status: stepStatus, toolCalls })}
                    type="button"
                  >
                    {step.output || step.errorMessage || 'Sem output registrado.'}
                  </button>
                </section>
                {step.toolCalls ? (
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-slate-500">Tool calls</h4>
                    {images.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((call, index) => (
                          <button
                            className="rounded border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-100"
                            key={`${step.id}-${call.result?.publicUrl ?? index}`}
                            onClick={() =>
                              setImagePreview({
                                url: call.result?.publicUrl ?? '',
                                title: `Imagem gerada - Step ${step.stepIndex}`,
                                path: call.result?.path || call.result?.absolutePath || '',
                              })
                            }
                            type="button"
                          >
                            Abrir imagem
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <pre className="trace-tool-calls">
                      {prettyJson(step.toolCalls)}
                    </pre>
                  </section>
                ) : null}
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </div>
    {imagePreview ? (
      <div className="image-preview-backdrop" role="presentation" onClick={() => setImagePreview(null)}>
        <section
          aria-modal="true"
          className="image-preview-modal"
          role="dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="image-preview-header">
            <div>
              <p className="text-xs font-semibold uppercase text-cyan-200">Preview</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{imagePreview.title}</h2>
              {imagePreview.path ? <p className="mt-1 break-all text-xs text-slate-300">{imagePreview.path}</p> : null}
            </div>
            <button className="image-preview-close" onClick={() => setImagePreview(null)} type="button" aria-label="Fechar preview">
              x
            </button>
          </div>
          <div className="image-preview-frame">
            <img alt={imagePreview.title} src={imagePreview.url} />
          </div>
        </section>
      </div>
    ) : null}
    {stepDetailPreview ? (
      <div className="detail-preview-backdrop" role="presentation" onClick={() => setStepDetailPreview(null)}>
        <section
          aria-modal="true"
          className="detail-preview-modal"
          role="dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="detail-preview-header">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-cyan-200">Trace completo</p>
              <h2 className="mt-1 break-words text-lg font-semibold text-white">Step {stepDetailPreview.step.stepIndex}</h2>
              <p className="mt-1 break-all text-xs text-slate-300">
                {stepDetailPreview.step.nodeId || stepDetailPreview.step.agentId || stepDetailPreview.step.id}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClass(stepDetailPreview.status)}`}>
                {statusLabel(stepDetailPreview.status)}
              </span>
              <button className="image-preview-close" onClick={() => setStepDetailPreview(null)} type="button" aria-label="Fechar detalhes">
                x
              </button>
            </div>
          </div>
          <div className="detail-preview-body">
            <section>
              <h3>Input recebido</h3>
              <pre>{stepDetailPreview.step.input || 'Sem input registrado.'}</pre>
            </section>
            <section>
              <h3>Output produzido</h3>
              <pre>{stepDetailPreview.step.output || stepDetailPreview.step.errorMessage || 'Sem output registrado.'}</pre>
            </section>
            <section>
              <h3>Tool calls</h3>
              <pre>{prettyJson(stepDetailPreview.step.toolCalls)}</pre>
            </section>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}

export default PlaygroundPage;
