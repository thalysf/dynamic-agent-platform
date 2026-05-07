import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Connection,
  Controls,
  Edge,
  IsValidConnection,
  MiniMap,
  NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Agent,
  Pipeline,
  PipelinePayload,
  Project,
  createPipeline,
  deletePipeline,
  updatePipeline,
  validatePipeline,
} from '../api/client';
import AgentFlowNode from '../flows/AgentFlowNode';
import { parseFlow } from '../flows/flowUtils';
import { AgentNode } from '../flows/types';

type StudioPageProps = {
  selectedProject: Project | null;
  agents: Agent[];
  pipelines: Pipeline[];
  selectedPipeline: Pipeline | null;
  selectedPipelineId: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSelectPipeline: (pipelineId: string) => void;
  onPipelinesChanged: () => Promise<void>;
  onError: (message: string | null) => void;
};

const nodeTypes: NodeTypes = {
  agent: AgentFlowNode,
};

function StudioPageContent({
  selectedProject,
  agents,
  pipelines,
  selectedPipeline,
  selectedPipelineId,
  busy,
  onBusyChange,
  onSelectPipeline,
  onPipelinesChanged,
  onError,
}: StudioPageProps) {
  const [pipelineDraft, setPipelineDraft] = useState<PipelinePayload>({
    name: 'Main Pipeline',
    description: '',
    nodesJson: '[]',
    edgesJson: '[]',
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<AgentNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedAgentToAdd, setSelectedAgentToAdd] = useState('');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationOk, setValidationOk] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  useEffect(() => {
    setSelectedAgentToAdd((current) => current || agents[0]?.id || '');
  }, [agents]);

  useEffect(() => {
    setNodes(parseFlow<AgentNode[]>(selectedPipeline?.nodesJson, []));
    setEdges(parseFlow<Edge[]>(selectedPipeline?.edgesJson, []));
    setPipelineDraft({
      name: selectedPipeline?.name || 'Main Pipeline',
      description: selectedPipeline?.description || '',
      nodesJson: selectedPipeline?.nodesJson || '[]',
      edgesJson: selectedPipeline?.edgesJson || '[]',
    });
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setValidationErrors([]);
    setValidationOk(false);
    setSaveMessage('');
  }, [selectedPipeline, setEdges, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
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
      setValidationOk(false);
    },
    [setEdges],
  );

  const isValidConnection = useCallback<IsValidConnection<Edge>>((connection) => connection.source !== connection.target, []);

  async function createNewPipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    onBusyChange(true);
    onError(null);
    try {
      const created = await createPipeline(selectedProject.id, {
        name: pipelineDraft.name,
        description: pipelineDraft.description,
        nodesJson: '[]',
        edgesJson: '[]',
      });
      await onPipelinesChanged();
      onSelectPipeline(created.id);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao criar pipeline');
    } finally {
      onBusyChange(false);
    }
  }

  async function deleteCurrentPipeline() {
    if (!selectedProject || !selectedPipeline || !window.confirm(`Deletar a pipeline "${selectedPipeline.name}"?`)) {
      return;
    }
    onBusyChange(true);
    onError(null);
    try {
      await deletePipeline(selectedProject.id, selectedPipeline.id);
      onSelectPipeline('');
      await onPipelinesChanged();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao deletar pipeline');
    } finally {
      onBusyChange(false);
    }
  }

  function addAgentNode() {
    const agent = agentById.get(selectedAgentToAdd);
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
    setValidationOk(false);
  }

  function deleteSelectedElements() {
    setNodes((current) => current.filter((node) => !selectedNodeIds.includes(node.id)));
    setEdges((current) =>
      current.filter((edge) => !selectedEdgeIds.includes(edge.id) && !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)),
    );
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setValidationOk(false);
  }

  async function saveGraph() {
    if (!selectedProject || !selectedPipeline) {
      return null;
    }
    onBusyChange(true);
    onError(null);
    try {
      const updated = await updatePipeline(selectedProject.id, selectedPipeline.id, {
        name: pipelineDraft.name,
        description: pipelineDraft.description,
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
      });
      await onPipelinesChanged();
      setSaveMessage('Grafo salvo');
      return updated;
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao salvar grafo');
      return null;
    } finally {
      onBusyChange(false);
    }
  }

  async function validateGraph() {
    if (!selectedProject || !selectedPipeline) {
      return;
    }
    const saved = await saveGraph();
    if (!saved) {
      return;
    }
    try {
      const validation = await validatePipeline(selectedProject.id, selectedPipeline.id);
      setValidationErrors(validation.errors);
      setValidationOk(validation.valid);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao validar pipeline');
    }
  }

  if (!selectedProject) {
    return (
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Studio</h2>
        <p className="mt-2 text-sm text-slate-600">Selecione um projeto para montar pipelines visuais.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Pipelines</h2>
          <form className="mt-4 space-y-3" onSubmit={createNewPipeline}>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              maxLength={120}
              required
              value={pipelineDraft.name}
              onChange={(event) => setPipelineDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <textarea
              className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Descricao da pipeline"
              value={pipelineDraft.description}
              onChange={(event) => setPipelineDraft((current) => ({ ...current, description: event.target.value }))}
            />
            <button className="w-full rounded bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={busy}>
              Criar pipeline
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {pipelines.map((pipeline) => (
              <button
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  pipeline.id === selectedPipelineId ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
                }`}
                key={pipeline.id}
                onClick={() => onSelectPipeline(pipeline.id)}
                type="button"
              >
                <span className="block font-semibold">{pipeline.name}</span>
                <span className="line-clamp-2 text-xs text-slate-500">{pipeline.description || 'Sem descricao'}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Agentes do fluxo</h2>
          <div className="mt-4 space-y-3">
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
            <button
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-medium disabled:bg-slate-100"
              disabled={!selectedPipeline || !selectedAgentToAdd}
              onClick={addAgentNode}
              type="button"
            >
              Adicionar node
            </button>
            <button
              className="w-full rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-700 disabled:bg-slate-100 disabled:text-slate-400"
              disabled={!selectedNodeIds.length && !selectedEdgeIds.length}
              onClick={deleteSelectedElements}
              type="button"
            >
              Remover selecionados
            </button>
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{selectedPipeline?.name || 'Crie ou selecione uma pipeline'}</h2>
              <p className="mt-1 text-sm text-slate-600">{selectedProject.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium disabled:bg-slate-100"
                disabled={!selectedPipeline || busy}
                onClick={saveGraph}
                type="button"
              >
                Salvar grafo
              </button>
              <button
                className="rounded bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                disabled={!selectedPipeline || busy}
                onClick={validateGraph}
                type="button"
              >
                Validar
              </button>
              <button
                className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!selectedPipeline || busy}
                onClick={() => void deleteCurrentPipeline()}
                type="button"
              >
                Deletar pipeline
              </button>
            </div>
          </div>
          <div className="h-[640px] overflow-hidden rounded border border-slate-200 bg-slate-50">
            <ReactFlow
              edges={edges}
              fitView
              isValidConnection={isValidConnection}
              nodeTypes={nodeTypes}
              nodes={nodes}
              onConnect={onConnect}
              onEdgesChange={onEdgesChange}
              onNodesChange={onNodesChange}
              onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
                setSelectedNodeIds(selectedNodes.map((node) => node.id));
                setSelectedEdgeIds(selectedEdges.map((edge) => edge.id));
              }}
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {saveMessage ? <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{saveMessage}</div> : null}
          {validationOk ? <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Pipeline valida</div> : null}
          {validationErrors.length ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StudioPage(props: StudioPageProps) {
  return (
    <ReactFlowProvider>
      <StudioPageContent {...props} />
    </ReactFlowProvider>
  );
}

export default StudioPage;
