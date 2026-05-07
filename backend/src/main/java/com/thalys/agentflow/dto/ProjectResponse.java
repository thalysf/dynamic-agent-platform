package com.thalys.agentflow.dto;

import java.time.Instant;
import java.util.UUID;

import com.thalys.agentflow.domain.Project;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        Instant createdAt,
        Instant updatedAt) {

    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
