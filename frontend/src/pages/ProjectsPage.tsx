import { FormEvent, useMemo, useState } from 'react';

import { Project, ProjectPayload, createProject, deleteProject, updateProject } from '../api/client';

type ProjectsPageProps = {
  projects: Project[];
  selectedProjectId: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSelectProject: (projectId: string) => void;
  onProjectsChanged: () => Promise<void>;
  onError: (message: string | null) => void;
};

const EMPTY_PROJECT: ProjectPayload = {
  name: '',
  description: '',
};

function ProjectsPage({
  projects,
  selectedProjectId,
  busy,
  onBusyChange,
  onSelectProject,
  onProjectsChanged,
  onError,
}: ProjectsPageProps) {
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const [draft, setDraft] = useState<ProjectPayload>(EMPTY_PROJECT);
  const [editingId, setEditingId] = useState<string | null>(null);

  function startEdit(project: Project) {
    setEditingId(project.id);
    setDraft({ name: project.name, description: project.description || '' });
    onSelectProject(project.id);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_PROJECT);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBusyChange(true);
    onError(null);
    try {
      if (editingId) {
        await updateProject(editingId, draft);
        onSelectProject(editingId);
      } else {
        const created = await createProject(draft);
        onSelectProject(created.id);
      }
      resetForm();
      await onProjectsChanged();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao salvar projeto');
    } finally {
      onBusyChange(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Deletar o projeto "${project.name}" e seus dados vinculados?`)) {
      return;
    }
    onBusyChange(true);
    onError(null);
    try {
      await deleteProject(project.id);
      if (selectedProjectId === project.id) {
        onSelectProject('');
      }
      await onProjectsChanged();
      resetForm();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Falha ao deletar projeto');
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{editingId ? 'Editar projeto' : 'Criar projeto'}</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              maxLength={120}
              required
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Descricao</span>
            <textarea
              className="mt-1 min-h-32 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="flex gap-2">
            <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={busy}>
              {editingId ? 'Salvar alteracoes' : 'Criar projeto'}
            </button>
            {editingId ? (
              <button className="rounded border border-slate-300 px-4 py-2 text-sm" onClick={resetForm} type="button">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Projetos existentes</h2>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {projects.map((project) => (
              <article
                className={`rounded border p-4 ${
                  project.id === selectedProjectId ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
                }`}
                key={project.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">{project.description || 'Sem descricao'}</p>
                  </div>
                  <button className="rounded border border-slate-300 px-3 py-1 text-sm" onClick={() => onSelectProject(project.id)}>
                    Abrir
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => startEdit(project)} type="button">
                    Editar
                  </button>
                  <button
                    className="rounded border border-red-200 px-3 py-2 text-sm text-red-700"
                    onClick={() => void handleDelete(project)}
                    type="button"
                  >
                    Deletar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {selectedProject ? (
          <aside className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Projeto selecionado</p>
            <h2 className="mt-2 text-xl font-semibold">{selectedProject.name}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedProject.description || 'Sem descricao'}</p>
          </aside>
        ) : null}
      </section>
    </div>
  );
}

export default ProjectsPage;
