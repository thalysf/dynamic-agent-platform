import { ReactNode } from 'react';

import { Project } from '../api/client';

export type AppView = 'home' | 'projects' | 'agents' | 'studio' | 'playground';

type AppShellProps = {
  children: ReactNode;
  projects: Project[];
  selectedProjectId: string;
  view: AppView;
  loading: boolean;
  error: string | null;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: AppView) => void;
  onRefresh: () => void;
};

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'projects', label: 'Projetos' },
  { id: 'agents', label: 'Agentes' },
  { id: 'studio', label: 'Studio' },
  { id: 'playground', label: 'Playground' },
];

function AppShell({
  children,
  projects,
  selectedProjectId,
  view,
  loading,
  error,
  onSelectProject,
  onNavigate,
  onRefresh,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">AgentFlow Studio</p>
            <h1 className="text-2xl font-semibold">Workspace multiagente</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="min-w-72 rounded border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedProjectId}
              onChange={(event) => onSelectProject(event.target.value)}
            >
              <option value="">Sem projeto selecionado</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button className="rounded border border-slate-300 px-3 py-2 text-sm font-medium" onClick={onRefresh} type="button">
              {loading ? 'Carregando' : 'Atualizar'}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto px-4 pb-4">
          {NAV_ITEMS.map((item) => (
            <button
              className={`rounded px-3 py-2 text-sm font-medium ${
                view === item.id ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {error ? (
        <div className="mx-auto max-w-[1600px] px-4 pt-4">
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1600px] px-4 py-5">{children}</div>
    </main>
  );
}

export default AppShell;
