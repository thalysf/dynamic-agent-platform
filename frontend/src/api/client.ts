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

export function listProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export function createProject(payload: ProjectPayload): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
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
