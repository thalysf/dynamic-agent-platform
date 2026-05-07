import { useEffect, useState } from 'react';

import {
  Execution,
  ExecutionStep,
  Pipeline,
  Project,
  listExecutionSteps,
  runPipeline,
  validatePipeline,
} from '../api/client';

type PlaygroundPageProps = {
  selectedProject: Project | null;
  selectedPipeline: Pipeline | null;
  pipelines: Pipeline[];
  executions: Execution[];
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSelectPipeline: (pipelineId: string) => void;
  onExecutionsChanged: () => Promise<void>;
  onError: (message: string | null) => void;
};

function PlaygroundPage({
  selectedProject,
  selectedPipeline,
  pipelines,
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

  useEffect(() => {
    setSelectedExecution(null);
    setSteps([]);
    setValidationErrors([]);
  }, [selectedPipeline?.id]);

  async function loadSteps(execution: Execution) {
    setSelectedExecution(execution);
    setSteps(await listExecutionSteps(execution.id));
  }

  async function executePipeline() {
    if (!selectedProject || !selectedPipeline || !initialInput.trim()) {
      return;
    }
    onBusyChange(true);
    onError(null);
    try {
      const validation = await validatePipeline(selectedProject.id, selectedPipeline.id);
      setValidationErrors(validation.errors);
      if (!validation.valid) {
        return;
      }
      const execution = await runPipeline(selectedProject.id, selectedPipeline.id, initialInput);
      await onExecutionsChanged();
      await loadSteps(execution);
    } catch (reason) {
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
            Executar
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
                <span className="block font-semibold">{execution.status}</span>
                <span className="block text-xs text-slate-500">{execution.startedAt || execution.id}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <article className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">{selectedPipeline?.name || 'Nenhuma pipeline selecionada'}</h2>
          {selectedExecution ? (
            <div className="mt-4 rounded border border-slate-200 p-4">
              <p className="text-sm font-semibold">{selectedExecution.status}</p>
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
                  <h3 className="font-semibold">Step {step.stepIndex}</h3>
                  <p className="mt-1 text-xs text-slate-500">{step.nodeId || step.agentId}</p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">{step.status}</span>
              </div>
              <h4 className="mt-4 text-xs font-semibold uppercase text-slate-500">Input</h4>
              <p className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs leading-5">{step.input || ''}</p>
              <h4 className="mt-4 text-xs font-semibold uppercase text-slate-500">Output</h4>
              <p className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs leading-5">{step.output || step.errorMessage || ''}</p>
              {step.toolCalls ? (
                <>
                  <h4 className="mt-4 text-xs font-semibold uppercase text-slate-500">Tool calls</h4>
                  <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{step.toolCalls}</pre>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PlaygroundPage;
