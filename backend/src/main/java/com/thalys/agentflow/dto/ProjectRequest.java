package com.thalys.agentflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 5000) String description) {
}
