package com.thalys.agentflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PipelineRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 5000) String description,
        String nodesJson,
        String edgesJson) {
}
