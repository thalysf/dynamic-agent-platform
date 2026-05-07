import operator
from datetime import datetime, timezone
from typing import Annotated, Any

from langgraph.graph import END, START, StateGraph
from typing_extensions import TypedDict

from app.a2a.message import A2AMessage
from app.llm.groq_client import generate_agent_output
from app.mcp.tools import run_allowed_tools
from app.schemas.orchestration import AgentPayload, OrchestrationRunRequest


class PipelineState(TypedDict):
    current_input: str
    previous_outputs: dict[str, str]
    final_output: str
    steps: Annotated[list[dict[str, Any]], operator.add]


def execute_pipeline_graph(request: OrchestrationRunRequest) -> dict[str, Any]:
    ordered_nodes = topological_nodes(request.pipeline.nodes, request.pipeline.edges)
    if not ordered_nodes:
        final_output = f"Execution completed without nodes. Input: {request.initialInput.content}"
        return {"final_output": final_output, "steps": []}

    agents_by_id = {str(agent.id): agent for agent in request.agents}

    builder = StateGraph(PipelineState)
    previous_name = START
    for index, node in enumerate(ordered_nodes, start=1):
        node_name = f"node_{index}"
        builder.add_node(node_name, build_agent_node(request, node, agents_by_id, index))
        builder.add_edge(previous_name, node_name)
        previous_name = node_name
    builder.add_edge(previous_name, END)

    graph = builder.compile()
    return graph.invoke(
        {
            "current_input": request.initialInput.content,
            "previous_outputs": {},
            "final_output": "",
            "steps": [],
        }
    )


def build_agent_node(
    request: OrchestrationRunRequest,
    node: dict[str, Any],
    agents_by_id: dict[str, AgentPayload],
    index: int,
):
    def run_agent(state: PipelineState) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc)
        node_id = str(node.get("id", f"node-{index}"))
        agent_id = str(node.get("data", {}).get("agentId", ""))
        agent = agents_by_id.get(agent_id)
        if agent is None:
            raise ValueError(f"Node {node_id} references missing agent {agent_id}.")

        context = {
            "previousOutputs": state["previous_outputs"],
            "initialInput": request.initialInput.content,
        }
        message = A2AMessage(
            executionId=request.executionId,
            senderAgentId="system" if index == 1 else "previous-agent",
            receiverAgentId=agent.id,
            content=state["current_input"],
            context=context,
            metadata={"stepIndex": index, "pipelineId": str(request.pipeline.id), "nodeId": node_id},
        )
        tool_calls = run_allowed_tools(agent.allowedTools, state["current_input"], context)
        output = generate_agent_output(agent, message.content, context, tool_calls)
        finished_at = datetime.now(timezone.utc)
        previous_outputs = dict(state["previous_outputs"])
        previous_outputs[node_id] = output

        return {
            "current_input": output,
            "previous_outputs": previous_outputs,
            "final_output": output,
            "steps": [
                {
                    "index": index,
                    "nodeId": node_id,
                    "agentId": str(agent.id),
                    "agentName": agent.name,
                    "status": "COMPLETED",
                    "input": message.content,
                    "output": output,
                    "toolCalls": tool_calls,
                    "startedAt": started_at.isoformat(),
                    "finishedAt": finished_at.isoformat(),
                    "errorMessage": None,
                }
            ],
        }

    return run_agent


def topological_nodes(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> list[dict[str, Any]]:
    nodes_by_id = {str(node["id"]): node for node in nodes if node.get("id")}
    indegree = {node_id: 0 for node_id in nodes_by_id}
    outgoing = {node_id: [] for node_id in nodes_by_id}

    for edge in edges:
        source = str(edge.get("source", ""))
        target = str(edge.get("target", ""))
        if source in nodes_by_id and target in nodes_by_id:
            outgoing[source].append(target)
            indegree[target] += 1

    queue = [node_id for node_id, count in indegree.items() if count == 0]
    ordered: list[dict[str, Any]] = []
    while queue:
        node_id = queue.pop(0)
        ordered.append(nodes_by_id[node_id])
        for target in outgoing[node_id]:
            indegree[target] -= 1
            if indegree[target] == 0:
                queue.append(target)

    return ordered if len(ordered) == len(nodes_by_id) else []
