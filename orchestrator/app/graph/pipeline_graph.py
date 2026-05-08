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
    initial_input: str
    outputs: Annotated[list[dict[str, str]], operator.add]
    steps: Annotated[list[dict[str, Any]], operator.add]


def execute_pipeline_graph(request: OrchestrationRunRequest) -> dict[str, Any]:
    graph_spec = build_graph_spec(request.pipeline.nodes, request.pipeline.edges)
    ordered_nodes = graph_spec["ordered_nodes"]
    if not ordered_nodes:
        empty_output = f"Execution completed without nodes. Input: {request.initialInput.content}"
        return {"final_output": empty_output, "steps": []}

    agents_by_id = {str(agent.id): agent for agent in request.agents}
    node_names = {node_id: f"node_{index}" for index, node_id in enumerate(graph_spec["nodes_by_id"], start=1)}

    builder = StateGraph(PipelineState)
    for index, node in enumerate(ordered_nodes, start=1):
        node_id = str(node["id"])
        builder.add_node(
            node_names[node_id],
            build_agent_node(
                request=request,
                node=node,
                agents_by_id=agents_by_id,
                index=index,
                predecessor_ids=graph_spec["incoming"][node_id],
            ),
        )

    for node_id in graph_spec["nodes_by_id"]:
        source_name = node_names[node_id]
        predecessors = graph_spec["incoming"][node_id]
        successors = graph_spec["outgoing"][node_id]
        if not predecessors:
            builder.add_edge(START, source_name)
        for target_id in successors:
            builder.add_edge(source_name, node_names[target_id])
        if not successors:
            builder.add_edge(source_name, END)

    graph = builder.compile()
    result = graph.invoke(
        {
            "initial_input": request.initialInput.content,
            "outputs": [],
            "steps": [],
        }
    )
    outputs_by_node = output_map(result["outputs"])
    return {
        "final_output": compute_final_output(outputs_by_node, graph_spec["terminal_ids"], graph_spec["ordered_ids"]),
        "steps": sorted(result["steps"], key=lambda step: step["index"]),
    }


def build_agent_node(
    request: OrchestrationRunRequest,
    node: dict[str, Any],
    agents_by_id: dict[str, AgentPayload],
    index: int,
    predecessor_ids: list[str],
):
    def run_agent(state: PipelineState) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc)
        node_id = str(node.get("id", f"node-{index}"))
        agent_id = str(node.get("data", {}).get("agentId", ""))
        agent = agents_by_id.get(agent_id)
        if agent is None:
            raise ValueError(f"Node {node_id} references missing agent {agent_id}.")

        direct_inputs = direct_predecessor_outputs(output_map(state["outputs"]), predecessor_ids)
        input_content = node_input(state["initial_input"], direct_inputs)
        context = {
            "previousOutputs": direct_inputs,
            "initialInput": state["initial_input"],
        }
        message = A2AMessage(
            executionId=request.executionId,
            senderAgentId="system" if not predecessor_ids else "direct-predecessors",
            receiverAgentId=agent.id,
            content=input_content,
            context=context,
            metadata={"stepIndex": index, "pipelineId": str(request.pipeline.id), "nodeId": node_id},
        )
        tool_calls = run_allowed_tools(agent.allowedTools, input_content, context)
        output = generate_agent_output(agent, message.content, context, tool_calls)
        finished_at = datetime.now(timezone.utc)

        return {
            "outputs": [{"nodeId": node_id, "output": output}],
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


def build_graph_spec(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> dict[str, Any]:
    nodes_by_id = {str(node["id"]): node for node in nodes if node.get("id")}
    indegree = {node_id: 0 for node_id in nodes_by_id}
    outgoing = {node_id: [] for node_id in nodes_by_id}
    incoming = {node_id: [] for node_id in nodes_by_id}

    for edge in edges:
        source = str(edge.get("source", ""))
        target = str(edge.get("target", ""))
        if source in nodes_by_id and target in nodes_by_id:
            outgoing[source].append(target)
            incoming[target].append(source)
            indegree[target] += 1

    queue = [node_id for node_id, count in indegree.items() if count == 0]
    ordered_ids: list[str] = []
    while queue:
        node_id = queue.pop(0)
        ordered_ids.append(node_id)
        for target in outgoing[node_id]:
            indegree[target] -= 1
            if indegree[target] == 0:
                queue.append(target)

    if len(ordered_ids) != len(nodes_by_id):
        ordered_ids = []

    return {
        "nodes_by_id": nodes_by_id,
        "ordered_ids": ordered_ids,
        "ordered_nodes": [nodes_by_id[node_id] for node_id in ordered_ids],
        "incoming": incoming,
        "outgoing": outgoing,
        "terminal_ids": [node_id for node_id in ordered_ids if not outgoing[node_id]],
    }


def output_map(outputs: list[dict[str, str]]) -> dict[str, str]:
    return {item["nodeId"]: item["output"] for item in outputs if item.get("nodeId")}


def direct_predecessor_outputs(outputs_by_node: dict[str, str], predecessor_ids: list[str]) -> dict[str, str]:
    return {node_id: outputs_by_node[node_id] for node_id in predecessor_ids if node_id in outputs_by_node}


def node_input(initial_input: str, direct_inputs: dict[str, str]) -> str:
    if not direct_inputs:
        return initial_input
    if len(direct_inputs) == 1:
        return next(iter(direct_inputs.values()))
    return "\n\n".join(f"Output from {node_id}:\n{output}" for node_id, output in direct_inputs.items())


def compute_final_output(outputs_by_node: dict[str, str], terminal_ids: list[str], ordered_ids: list[str]) -> str:
    terminal_outputs = [outputs_by_node[node_id] for node_id in terminal_ids if node_id in outputs_by_node]
    if not terminal_outputs and ordered_ids:
        last_output = outputs_by_node.get(ordered_ids[-1])
        return last_output or ""
    if len(terminal_outputs) == 1:
        return terminal_outputs[0]
    return "\n\n".join(terminal_outputs)
