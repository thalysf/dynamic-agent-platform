package com.thalys.agentflow.dto;

import java.time.Instant;
import java.util.UUID;

import com.thalys.agentflow.domain.Pipeline;

public record PipelineResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        String nodesJson,
        String edgesJson,
        Instant createdAt,
        Instant updatedAt) {

    public static PipelineResponse from(Pipeline pipeline) {
        return new PipelineResponse(
                pipeline.getId(),
                pipeline.getProject().getId(),
                pipeline.getName(),
                pipeline.getDescription(),
                pipeline.getNodesJson(),
                pipeline.getEdgesJson(),
                pipeline.getCreatedAt(),
                pipeline.getUpdatedAt());
    }
}
