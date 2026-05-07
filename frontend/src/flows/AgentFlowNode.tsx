import { Handle, NodeProps, Position } from '@xyflow/react';

import { AgentNode } from './types';

function AgentFlowNode({ data, selected }: NodeProps<AgentNode>) {
  return (
    <div className={`w-60 rounded border bg-white p-3 shadow-sm ${selected ? 'border-sky-500' : 'border-slate-300'}`}>
      <Handle className="h-3 w-3" type="target" position={Position.Left} />
      <p className="truncate text-sm font-semibold text-slate-950">{data.label}</p>
      <p className="mt-1 text-xs font-medium text-sky-700">{data.agentType}</p>
      <Handle className="h-3 w-3" type="source" position={Position.Right} />
    </div>
  );
}

export default AgentFlowNode;
