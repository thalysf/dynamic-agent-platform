package com.thalys.agentflow.dto;

import java.time.Instant;
import java.util.UUID;

import com.thalys.agentflow.domain.Execution;
import com.thalys.agentflow.domain.ExecutionStatus;

public record ExecutionResponse(
        UUID id,
        UUID pipelineId,
        ExecutionStatus status,
        String initialInput,
        String finalOutput,
        Instant startedAt,
        Instant finishedAt,
        String errorMessage) {

    public static ExecutionResponse from(Execution execution) {
        return new ExecutionResponse(
                execution.getId(),
                execution.getPipeline().getId(),
                execution.getStatus(),
                execution.getInitialInput(),
                execution.getFinalOutput(),
                execution.getStartedAt(),
                execution.getFinishedAt(),
                execution.getErrorMessage());
    }
}
