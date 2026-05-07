package com.thalys.agentflow.service;

import java.time.Instant;
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
import com.thalys.agentflow.domain.ExecutionStatus;
import com.thalys.agentflow.domain.ExecutionStep;
import com.thalys.agentflow.domain.Pipeline;
import com.thalys.agentflow.dto.AgentResponse;
import com.thalys.agentflow.dto.ExecutionRequest;
import com.thalys.agentflow.dto.ExecutionResponse;
import com.thalys.agentflow.dto.ExecutionStepResponse;
import com.thalys.agentflow.dto.OrchestratorRunRequest;
import com.thalys.agentflow.dto.OrchestratorRunResponse;
import com.thalys.agentflow.dto.PipelineValidationResponse;
import com.thalys.agentflow.repository.AgentRepository;
import com.thalys.agentflow.repository.ExecutionRepository;
import com.thalys.agentflow.repository.ExecutionStepRepository;

@Service
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final ExecutionStepRepository executionStepRepository;
    private final AgentRepository agentRepository;
    private final PipelineService pipelineService;
    private final OrchestratorClient orchestratorClient;
    private final ObjectMapper objectMapper;

    public ExecutionService(ExecutionRepository executionRepository, ExecutionStepRepository executionStepRepository,
            AgentRepository agentRepository,
            PipelineService pipelineService, OrchestratorClient orchestratorClient, ObjectMapper objectMapper) {
        this.executionRepository = executionRepository;
        this.executionStepRepository = executionStepRepository;
        this.agentRepository = agentRepository;
        this.pipelineService = pipelineService;
        this.orchestratorClient = orchestratorClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ExecutionResponse run(UUID projectId, UUID pipelineId, ExecutionRequest request) {
        Pipeline pipeline = pipelineService.findPipeline(projectId, pipelineId);
        PipelineValidationResponse validation = pipelineService.validate(projectId, pipelineId);
        if (!validation.valid()) {
            throw new IllegalArgumentException("Invalid pipeline: " + String.join("; ", validation.errors()));
        }

        Execution execution = executionRepository.save(new Execution(pipeline, request.initialInput().trim()));
        execution.markRunning();
        executionRepository.save(execution);

        try {
            OrchestratorRunResponse response = orchestratorClient.run(buildRunRequest(projectId, pipeline, execution));
            if (response == null) {
                execution.markFailed("Orchestrator returned no response.");
            } else if ("COMPLETED".equalsIgnoreCase(response.status())) {
                execution.markCompleted(response.finalOutput());
                persistSteps(execution, response.steps());
            } else {
                execution.markFailed(response.finalOutput());
                persistSteps(execution, response.steps());
            }
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

    @Transactional(readOnly = true)
    public List<ExecutionStepResponse> findSteps(UUID executionId) {
        if (!executionRepository.existsById(executionId)) {
            throw new ResourceNotFoundException("Execution not found: " + executionId);
        }
        return executionStepRepository.findByExecutionIdOrderByStepIndexAsc(executionId).stream()
                .map(ExecutionStepResponse::from)
                .toList();
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

    private void persistSteps(Execution execution, List<Map<String, Object>> steps) {
        if (steps == null || steps.isEmpty()) {
            return;
        }
        Instant fallbackTime = Instant.now();
        for (Map<String, Object> step : steps) {
            ExecutionStep executionStep = new ExecutionStep(
                    execution,
                    intValue(step.get("index")),
                    stringValue(step.get("nodeId")),
                    uuidValue(step.get("agentId")),
                    statusValue(step.get("status")),
                    stringValue(step.get("input")),
                    stringValue(step.get("output")),
                    jsonValue(step.get("toolCalls")),
                    instantValue(step.get("startedAt"), fallbackTime),
                    instantValue(step.get("finishedAt"), fallbackTime),
                    stringValue(step.get("errorMessage")));
            executionStepRepository.save(executionStep);
        }
    }

    private int intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null) {
            return Integer.parseInt(value.toString());
        }
        return 0;
    }

    private UUID uuidValue(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        return UUID.fromString(value.toString());
    }

    private ExecutionStatus statusValue(Object value) {
        if (value == null) {
            return ExecutionStatus.COMPLETED;
        }
        return ExecutionStatus.valueOf(value.toString());
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private Instant instantValue(Object value, Instant fallback) {
        if (value == null || value.toString().isBlank()) {
            return fallback;
        }
        return Instant.parse(value.toString());
    }

    private String jsonValue(Object value) {
        if (value == null) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return "[]";
        }
    }
}
