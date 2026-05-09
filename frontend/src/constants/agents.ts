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

export const GROQ_MODELS = [
  { id: 'allam-2-7b', label: 'allam-2-7b' },
  { id: 'groq/compound', label: 'groq/compound' },
  { id: 'groq/compound-mini', label: 'groq/compound-mini' },
  { id: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant' },
  { id: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  { id: 'meta-llama/llama-prompt-guard-2-22m', label: 'meta-llama/llama-prompt-guard-2-22m' },
  { id: 'meta-llama/llama-prompt-guard-2-86m', label: 'meta-llama/llama-prompt-guard-2-86m' },
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b' },
  { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b' },
  { id: 'openai/gpt-oss-safeguard-20b', label: 'openai/gpt-oss-safeguard-20b' },
  { id: 'qwen/qwen3-32b', label: 'qwen/qwen3-32b' },
] as const;

export type GroqModelId = (typeof GROQ_MODELS)[number]['id'];

export const DEFAULT_GROQ_MODEL: GroqModelId = 'meta-llama/llama-4-scout-17b-16e-instruct';

export const DEFAULT_AGENT: AgentPayload = {
  name: '',
  description: '',
  systemPrompt: '',
  agentType: 'GENERAL',
  modelProvider: 'groq',
  modelName: DEFAULT_GROQ_MODEL,
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
