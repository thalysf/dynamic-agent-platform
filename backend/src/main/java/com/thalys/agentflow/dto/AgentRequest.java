package com.thalys.agentflow.dto;

import java.math.BigDecimal;
import java.util.Set;

import com.thalys.agentflow.domain.AgentType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgentRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 5000) String description,
        @NotBlank @Size(max = 20000) String systemPrompt,
        AgentType agentType,
        @Size(max = 40) String modelProvider,
        @Size(max = 120) String modelName,
        @DecimalMin("0.0") @DecimalMax("2.0") BigDecimal temperature,
        Set<@Size(max = 120) String> allowedTools) {
}
