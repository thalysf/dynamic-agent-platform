import { Node } from '@xyflow/react';

export type AgentNodeData = {
  label: string;
  agentId: string;
  agentType: string;
};

export type AgentNode = Node<AgentNodeData, 'agent'>;
