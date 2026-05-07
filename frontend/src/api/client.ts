const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentType =
  | 'IDEATION'
  | 'WRITING'
  | 'CODE_GENERATION'
  | 'CODE_REVIEW'
  | 'TEST_GENERATION'
  | 'SUMMARY'
  | 'CRITIC'
  | 'GENERAL';

export type Agent = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  agentType: AgentType;
  modelProvider: string;
  modelName: string;
  temperature: number;
  allowedTools: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectPayload = {
  name: string;
  description: string;
};

export type AgentPayload = {
  name: string;
  description: string;
  systemPrompt: string;
  agentType: AgentType;
  modelProvider: string;
  modelName: string;
  temperature: number;
  allowedTools: string[];
};

export type Pipeline = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  nodesJson: string;
  edgesJson: string;
  createdAt: string;
  updatedAt: string;
};

export type PipelinePayload = {
  name: string;
  description: string;
  nodesJson: string;
  edgesJson: string;
};

export type PipelineValidation = {
  valid: boolean;
  errors: string[];
};

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type Execution = {
  id: string;
  pipelineId: string;
  status: ExecutionStatus;
  initialInput: string;
  finalOutput: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
};

export type ExecutionStep = {
  id: string;
  executionId: string;
  stepIndex: number;
  nodeId: string | null;
  agentId: string | null;
  status: ExecutionStatus;
  input: string | null;
  output: string | null;
  toolCalls: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
};

export function listProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export function createProject(payload: ProjectPayload): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProject(projectId: string, payload: ProjectPayload): Promise<Project> {
  return request<Project>(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteProject(projectId: string): Promise<void> {
  return request<void>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export function listAgents(projectId: string): Promise<Agent[]> {
  return request<Agent[]>(`/api/projects/${projectId}/agents`);
}

export function createAgent(projectId: string, payload: AgentPayload): Promise<Agent> {
  return request<Agent>(`/api/projects/${projectId}/agents`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAgent(projectId: string, agentId: string, payload: AgentPayload): Promise<Agent> {
  return request<Agent>(`/api/projects/${projectId}/agents/${agentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAgent(projectId: string, agentId: string): Promise<void> {
  return request<void>(`/api/projects/${projectId}/agents/${agentId}`, {
    method: 'DELETE',
  });
}

export function listPipelines(projectId: string): Promise<Pipeline[]> {
  return request<Pipeline[]>(`/api/projects/${projectId}/pipelines`);
}

export function createPipeline(projectId: string, payload: PipelinePayload): Promise<Pipeline> {
  return request<Pipeline>(`/api/projects/${projectId}/pipelines`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePipeline(projectId: string, pipelineId: string, payload: PipelinePayload): Promise<Pipeline> {
  return request<Pipeline>(`/api/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deletePipeline(projectId: string, pipelineId: string): Promise<void> {
  return request<void>(`/api/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'DELETE',
  });
}

export function validatePipeline(projectId: string, pipelineId: string): Promise<PipelineValidation> {
  return request<PipelineValidation>(`/api/projects/${projectId}/pipelines/${pipelineId}/validate`, {
    method: 'POST',
  });
}

export function runPipeline(projectId: string, pipelineId: string, initialInput: string): Promise<Execution> {
  return request<Execution>(`/api/projects/${projectId}/pipelines/${pipelineId}/executions`, {
    method: 'POST',
    body: JSON.stringify({ initialInput }),
  });
}

export function listExecutions(projectId: string, pipelineId: string): Promise<Execution[]> {
  return request<Execution[]>(`/api/projects/${projectId}/pipelines/${pipelineId}/executions`);
}

export function listExecutionSteps(executionId: string): Promise<ExecutionStep[]> {
  return request<ExecutionStep[]>(`/api/executions/${executionId}/steps`);
}
