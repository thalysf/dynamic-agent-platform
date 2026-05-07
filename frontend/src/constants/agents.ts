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

export const AVAILABLE_TOOLS = ['word_count', 'echo_context'];
