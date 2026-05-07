package com.thalys.agentflow.service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thalys.agentflow.domain.Pipeline;
import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.PipelineRequest;
import com.thalys.agentflow.dto.PipelineResponse;
import com.thalys.agentflow.dto.PipelineValidationResponse;
import com.thalys.agentflow.repository.AgentRepository;
import com.thalys.agentflow.repository.PipelineRepository;

@Service
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final AgentRepository agentRepository;
    private final ProjectService projectService;
    private final ObjectMapper objectMapper;

    public PipelineService(PipelineRepository pipelineRepository, AgentRepository agentRepository,
            ProjectService projectService, ObjectMapper objectMapper) {
        this.pipelineRepository = pipelineRepository;
        this.agentRepository = agentRepository;
        this.projectService = projectService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PipelineResponse create(UUID projectId, PipelineRequest request) {
        Project project = projectService.findProject(projectId);
        Pipeline pipeline = new Pipeline(project, request.name().trim(), request.description(), request.nodesJson(),
                request.edgesJson());
        return PipelineResponse.from(pipelineRepository.save(pipeline));
    }

    @Transactional(readOnly = true)
    public List<PipelineResponse> findAll(UUID projectId) {
        projectService.findProject(projectId);
        return pipelineRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(PipelineResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PipelineResponse findById(UUID projectId, UUID pipelineId) {
        return PipelineResponse.from(findPipeline(projectId, pipelineId));
    }

    @Transactional(readOnly = true)
    public PipelineValidationResponse validate(UUID projectId, UUID pipelineId) {
        Pipeline pipeline = findPipeline(projectId, pipelineId);
        return validate(projectId, pipeline.getNodesJson(), pipeline.getEdgesJson());
    }

    @Transactional
    public PipelineResponse update(UUID projectId, UUID pipelineId, PipelineRequest request) {
        Pipeline pipeline = findPipeline(projectId, pipelineId);
        pipeline.update(request.name().trim(), request.description(), request.nodesJson(), request.edgesJson());
        return PipelineResponse.from(pipelineRepository.save(pipeline));
    }

    @Transactional
    public void delete(UUID projectId, UUID pipelineId) {
        Pipeline pipeline = findPipeline(projectId, pipelineId);
        pipelineRepository.delete(pipeline);
    }

    public Pipeline findPipeline(UUID projectId, UUID pipelineId) {
        return pipelineRepository.findByIdAndProjectId(pipelineId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline not found: " + pipelineId));
    }

    public PipelineValidationResponse validate(UUID projectId, String nodesJson, String edgesJson) {
        projectService.findProject(projectId);
        List<String> errors = new ArrayList<>();
        List<Map<String, Object>> nodes = parseJsonArray(nodesJson, "nodesJson");
        List<Map<String, Object>> edges = parseJsonArray(edgesJson, "edgesJson");

        if (nodes.isEmpty()) {
            errors.add("Pipeline must contain at least one node.");
        }
        if (nodes.size() > 10) {
            errors.add("Pipeline can contain at most 10 agent nodes in V1.");
        }

        Set<String> nodeIds = new HashSet<>();
        Set<UUID> agentIds = new HashSet<>();
        for (Map<String, Object> node : nodes) {
            String nodeId = stringValue(node.get("id"));
            if (nodeId == null) {
                errors.add("Every node must have an id.");
                continue;
            }
            if (!nodeIds.add(nodeId)) {
                errors.add("Duplicated node id: " + nodeId);
            }

            UUID agentId = readAgentId(node);
            if (agentId == null) {
                errors.add("Node " + nodeId + " must reference data.agentId.");
            } else if (!agentRepository.findByIdAndProjectId(agentId, projectId).isPresent()) {
                errors.add("Node " + nodeId + " references an agent outside this project: " + agentId);
            } else {
                agentIds.add(agentId);
            }
        }

        Map<String, List<String>> outgoing = new HashMap<>();
        Map<String, Integer> incomingCount = new HashMap<>();
        for (String nodeId : nodeIds) {
            outgoing.put(nodeId, new ArrayList<>());
            incomingCount.put(nodeId, 0);
        }

        for (Map<String, Object> edge : edges) {
            String source = stringValue(edge.get("source"));
            String target = stringValue(edge.get("target"));
            if (source == null || target == null) {
                errors.add("Every edge must have source and target.");
                continue;
            }
            if (source.equals(target)) {
                errors.add("Self connections are not allowed: " + source);
            }
            if (!nodeIds.contains(source)) {
                errors.add("Edge references missing source node: " + source);
                continue;
            }
            if (!nodeIds.contains(target)) {
                errors.add("Edge references missing target node: " + target);
                continue;
            }
            outgoing.get(source).add(target);
            incomingCount.put(target, incomingCount.get(target) + 1);
        }

        if (!nodeIds.isEmpty() && incomingCount.values().stream().noneMatch(count -> count == 0)) {
            errors.add("Pipeline must have at least one initial node.");
        }
        if (hasCycle(nodeIds, outgoing)) {
            errors.add("Pipeline cannot contain cycles in V1.");
        }

        return new PipelineValidationResponse(errors.isEmpty(), errors);
    }

    private List<Map<String, Object>> parseJsonArray(String json, String fieldName) {
        try {
            return objectMapper.readValue(json == null || json.isBlank() ? "[]" : json,
                    new TypeReference<List<Map<String, Object>>>() {
                    });
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Invalid " + fieldName + ": expected a JSON array.");
        }
    }

    @SuppressWarnings("unchecked")
    private UUID readAgentId(Map<String, Object> node) {
        Object data = node.get("data");
        if (!(data instanceof Map<?, ?> dataMap)) {
            return null;
        }
        Object agentId = ((Map<String, Object>) dataMap).get("agentId");
        String value = stringValue(agentId);
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString();
        return text.isBlank() ? null : text;
    }

    private boolean hasCycle(Set<String> nodeIds, Map<String, List<String>> outgoing) {
        Map<String, Integer> indegree = new HashMap<>();
        for (String nodeId : nodeIds) {
            indegree.put(nodeId, 0);
        }
        for (List<String> targets : outgoing.values()) {
            for (String target : targets) {
                indegree.put(target, indegree.get(target) + 1);
            }
        }

        ArrayDeque<String> queue = new ArrayDeque<>();
        indegree.forEach((nodeId, count) -> {
            if (count == 0) {
                queue.add(nodeId);
            }
        });

        int visited = 0;
        while (!queue.isEmpty()) {
            String nodeId = queue.removeFirst();
            visited++;
            for (String target : outgoing.getOrDefault(nodeId, List.of())) {
                int nextCount = indegree.get(target) - 1;
                indegree.put(target, nextCount);
                if (nextCount == 0) {
                    queue.add(target);
                }
            }
        }

        return visited != nodeIds.size();
    }
}
