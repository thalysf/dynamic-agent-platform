import { AgentPayload, AgentType } from '../api/client';

export const AGENT_TYPES: AgentType[] = [
  'GENERAL',
  'IDEATION',
  'WRITING',
  'CODE_GENERATION',
  'CODE_REVIEW',
  'TEST_GENERATION',
  'SUMMARY',
  'CRITIC',
];

export const DEFAULT_AGENT: AgentPayload = {
  name: '',
  description: '',
  systemPrompt: '',
  agentType: 'GENERAL',
  modelProvider: 'groq',
  modelName: 'meta-llama/llama-4-scout-17b-16e-instruct',
  temperature: 0.7,
  allowedTools: [],
};

export const AVAILABLE_TOOLS = [
  { id: 'word_count', label: 'word_count' },
  { id: 'echo_context', label: 'echo_context' },
  { id: 'file_write', label: 'file_write' },
  { id: 'file_read', label: 'file_read' },
  { id: 'web_search', label: 'web_search' },
  { id: 'image_generate', label: 'image_generate' },
];
