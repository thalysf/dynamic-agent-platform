package com.thalys.agentflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thalys.agentflow.client.OrchestratorClient;
import com.thalys.agentflow.domain.Execution;
import com.thalys.agentflow.domain.ExecutionStatus;
import com.thalys.agentflow.domain.Pipeline;
import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.ExecutionRequest;
import com.thalys.agentflow.dto.OrchestratorRunResponse;
import com.thalys.agentflow.dto.PipelineValidationResponse;
import com.thalys.agentflow.repository.AgentRepository;
import com.thalys.agentflow.repository.ExecutionRepository;
import com.thalys.agentflow.repository.ExecutionStepRepository;

@ExtendWith(MockitoExtension.class)
class ExecutionServiceTest {

    @Mock
    private ExecutionRepository executionRepository;

    @Mock
    private ExecutionStepRepository executionStepRepository;

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private PipelineService pipelineService;

    @Mock
    private OrchestratorClient orchestratorClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ExecutionService executionService;

    @BeforeEach
    void setUp() {
        executionService = new ExecutionService(executionRepository, executionStepRepository, agentRepository,
                pipelineService, orchestratorClient, objectMapper);
    }

    @Test
    void runsPipelineAndPersistsCompletedExecution() {
        UUID projectId = UUID.randomUUID();
        UUID pipelineId = UUID.randomUUID();
        Project project = new Project("Project", null);
        Pipeline pipeline = new Pipeline(project, "Main", null, "[]", "[]");

        when(pipelineService.findPipeline(projectId, pipelineId)).thenReturn(pipeline);
        when(pipelineService.validate(projectId, pipelineId)).thenReturn(new PipelineValidationResponse(true, List.of()));
        when(executionRepository.save(any(Execution.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(agentRepository.findByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of());
        when(orchestratorClient.run(any())).thenReturn(new OrchestratorRunResponse(
                UUID.randomUUID(), "COMPLETED", "Mock output", List.of(Map.of())));

        var response = executionService.run(projectId, pipelineId, new ExecutionRequest("Hello"));

        assertThat(response.status()).isEqualTo(ExecutionStatus.COMPLETED);
        assertThat(response.finalOutput()).isEqualTo("Mock output");
        assertThat(response.startedAt()).isNotNull();
        assertThat(response.finishedAt()).isNotNull();
    }
}
