package com.thalys.agentflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExecutionRequest(
        @NotBlank @Size(max = 20000) String initialInput) {
}
