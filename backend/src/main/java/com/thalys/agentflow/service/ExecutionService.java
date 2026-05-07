package com.thalys.agentflow.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thalys.agentflow.client.OrchestratorClient;
import com.thalys.agentflow.domain.Execution;
import com.thalys.agentflow.domain.Pipeline;
import com.thalys.agentflow.dto.AgentResponse;
import com.thalys.agentflow.dto.ExecutionRequest;
import com.thalys.agentflow.dto.ExecutionResponse;
import com.thalys.agentflow.dto.OrchestratorRunRequest;
import com.thalys.agentflow.dto.OrchestratorRunResponse;
import com.thalys.agentflow.repository.AgentRepository;
import com.thalys.agentflow.repository.ExecutionRepository;

@Service
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final AgentRepository agentRepository;
    private final PipelineService pipelineService;
    private final OrchestratorClient orchestratorClient;
    private final ObjectMapper objectMapper;

    public ExecutionService(ExecutionRepository executionRepository, AgentRepository agentRepository,
            PipelineService pipelineService, OrchestratorClient orchestratorClient, ObjectMapper objectMapper) {
        this.executionRepository = executionRepository;
        this.agentRepository = agentRepository;
        this.pipelineService = pipelineService;
        this.orchestratorClient = orchestratorClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ExecutionResponse run(UUID projectId, UUID pipelineId, ExecutionRequest request) {
        Pipeline pipeline = pipelineService.findPipeline(projectId, pipelineId);
        Execution execution = executionRepository.save(new Execution(pipeline, request.initialInput().trim()));
        execution.markRunning();
        executionRepository.save(execution);

        try {
            OrchestratorRunResponse response = orchestratorClient.run(buildRunRequest(projectId, pipeline, execution));
            execution.markCompleted(response == null ? "" : response.finalOutput());
        } catch (RuntimeException exception) {
            execution.markFailed(exception.getMessage());
        }

        return ExecutionResponse.from(executionRepository.save(execution));
    }

    @Transactional(readOnly = true)
    public List<ExecutionResponse> findAll(UUID projectId, UUID pipelineId) {
        pipelineService.findPipeline(projectId, pipelineId);
        return executionRepository.findByPipelineIdOrderByStartedAtDesc(pipelineId).stream()
                .map(ExecutionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExecutionResponse findById(UUID executionId) {
        return executionRepository.findById(executionId)
                .map(ExecutionResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found: " + executionId));
    }

    private OrchestratorRunRequest buildRunRequest(UUID projectId, Pipeline pipeline, Execution execution) {
        List<AgentResponse> agents = agentRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(AgentResponse::from)
                .toList();
        Map<String, Object> pipelinePayload = Map.of(
                "id", pipeline.getId(),
                "nodes", parseJsonArray(pipeline.getNodesJson()),
                "edges", parseJsonArray(pipeline.getEdgesJson()));
        Map<String, Object> initialInput = Map.of(
                "content", execution.getInitialInput(),
                "attachments", List.of());
        return new OrchestratorRunRequest(execution.getId(), projectId, pipelinePayload, agents, initialInput);
    }

    private List<Map<String, Object>> parseJsonArray(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Invalid pipeline JSON", exception);
        }
    }
}
