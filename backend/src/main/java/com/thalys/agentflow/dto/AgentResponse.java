package com.thalys.agentflow.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import com.thalys.agentflow.domain.Agent;
import com.thalys.agentflow.domain.AgentType;

public record AgentResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        String systemPrompt,
        AgentType agentType,
        String modelProvider,
        String modelName,
        BigDecimal temperature,
        Set<String> allowedTools,
        Instant createdAt,
        Instant updatedAt) {

    public static AgentResponse from(Agent agent) {
        return new AgentResponse(
                agent.getId(),
                agent.getProject().getId(),
                agent.getName(),
                agent.getDescription(),
                agent.getSystemPrompt(),
                agent.getAgentType(),
                agent.getModelProvider(),
                agent.getModelName(),
                agent.getTemperature(),
                agent.getAllowedTools(),
                agent.getCreatedAt(),
                agent.getUpdatedAt());
    }
}
