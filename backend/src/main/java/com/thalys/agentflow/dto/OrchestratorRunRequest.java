package com.thalys.agentflow.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record OrchestratorRunRequest(
        UUID executionId,
        UUID projectId,
        Map<String, Object> pipeline,
        List<AgentResponse> agents,
        Map<String, Object> initialInput) {
}
