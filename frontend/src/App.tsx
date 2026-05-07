import { useCallback, useEffect, useMemo, useState } from 'react';

import { Agent, Execution, Pipeline, Project, listAgents, listExecutions, listPipelines, listProjects } from './api/client';
import AppShell, { AppView } from './components/AppShell';
import AgentsPage from './pages/AgentsPage';
import HomePage from './pages/HomePage';
import PlaygroundPage from './pages/PlaygroundPage';
import ProjectsPage from './pages/ProjectsPage';
import StudioPage from './pages/StudioPage';

const VIEWS: AppView[] = ['home', 'projects', 'agents', 'studio', 'playground'];

function readViewFromHash(): AppView {
  const value = window.location.hash.replace('#', '');
  return VIEWS.includes(value as AppView) ? (value as AppView) : 'home';
}

function App() {
  const [view, setView] = useState<AppView>(() => readViewFromHash());
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [executions, setExecutions] = useState<Execution[]>([]);
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
      setSelectedProjectId((current) => (current && data.some((project) => project.id === current) ? current : data[0]?.id || ''));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProjectData = useCallback(async (projectId: string) => {
    if (!projectId) {
      setAgents([]);
      setPipelines([]);
      setSelectedPipelineId('');
      setExecutions([]);
      return;
    }
    setError(null);
    try {
      const [agentData, pipelineData] = await Promise.all([listAgents(projectId), listPipelines(projectId)]);
      setAgents(agentData);
      setPipelines(pipelineData);
      setSelectedPipelineId((current) =>
        current && pipelineData.some((pipeline) => pipeline.id === current) ? current : pipelineData[0]?.id || '',
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao carregar dados do projeto');
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
      setError(reason instanceof Error ? reason.message : 'Falha ao carregar execucoes');
    }
  }, []);

  const refreshSelectedProjectData = useCallback(async () => {
    await refreshProjectData(selectedProjectId);
  }, [refreshProjectData, selectedProjectId]);

  const refreshSelectedExecutions = useCallback(async () => {
    await refreshExecutions(selectedProjectId, selectedPipelineId);
  }, [refreshExecutions, selectedPipelineId, selectedProjectId]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    void refreshProjectData(selectedProjectId);
  }, [refreshProjectData, selectedProjectId]);

  useEffect(() => {
    void refreshExecutions(selectedProjectId, selectedPipelineId);
  }, [refreshExecutions, selectedPipelineId, selectedProjectId]);

  useEffect(() => {
    function handleHashChange() {
      setView(readViewFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function navigate(nextView: AppView) {
    window.location.hash = nextView;
    setView(nextView);
  }

  return (
    <AppShell
      error={error}
      loading={loading}
      projects={projects}
      selectedProjectId={selectedProjectId}
      view={view}
      onNavigate={navigate}
      onRefresh={() => void refreshProjects()}
      onSelectProject={(projectId) => {
        setSelectedProjectId(projectId);
        setSelectedPipelineId('');
      }}
    >
      {view === 'home' ? (
        <HomePage agentCount={agents.length} pipelineCount={pipelines.length} projectCount={projects.length} onNavigate={navigate} />
      ) : null}

      {view === 'projects' ? (
        <ProjectsPage
          busy={busy}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onBusyChange={setBusy}
          onError={setError}
          onProjectsChanged={refreshProjects}
          onSelectProject={setSelectedProjectId}
        />
      ) : null}

      {view === 'agents' ? (
        <AgentsPage
          agents={agents}
          busy={busy}
          selectedProject={selectedProject}
          onAgentsChanged={refreshSelectedProjectData}
          onBusyChange={setBusy}
          onError={setError}
        />
      ) : null}

      {view === 'studio' ? (
        <StudioPage
          agents={agents}
          busy={busy}
          pipelines={pipelines}
          selectedPipeline={selectedPipeline}
          selectedPipelineId={selectedPipelineId}
          selectedProject={selectedProject}
          onBusyChange={setBusy}
          onError={setError}
          onPipelinesChanged={refreshSelectedProjectData}
          onSelectPipeline={setSelectedPipelineId}
        />
      ) : null}

      {view === 'playground' ? (
        <PlaygroundPage
          busy={busy}
          executions={executions}
          pipelines={pipelines}
          selectedPipeline={selectedPipeline}
          selectedProject={selectedProject}
          onBusyChange={setBusy}
          onError={setError}
          onExecutionsChanged={refreshSelectedExecutions}
          onSelectPipeline={setSelectedPipelineId}
        />
      ) : null}
    </AppShell>
  );
}

export default App;
