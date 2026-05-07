package com.thalys.agentflow.dto;

import java.time.Instant;
import java.util.UUID;

import com.thalys.agentflow.domain.ExecutionStatus;
import com.thalys.agentflow.domain.ExecutionStep;

public record ExecutionStepResponse(
        UUID id,
        UUID executionId,
        int stepIndex,
        String nodeId,
        UUID agentId,
        ExecutionStatus status,
        String input,
        String output,
        String toolCalls,
        Instant startedAt,
        Instant finishedAt,
        String errorMessage) {

    public static ExecutionStepResponse from(ExecutionStep step) {
        return new ExecutionStepResponse(
                step.getId(),
                step.getExecution().getId(),
                step.getStepIndex(),
                step.getNodeId(),
                step.getAgentId(),
                step.getStatus(),
                step.getInput(),
                step.getOutput(),
                step.getToolCalls(),
                step.getStartedAt(),
                step.getFinishedAt(),
                step.getErrorMessage());
    }
}
