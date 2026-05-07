package com.thalys.agentflow.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record OrchestratorRunResponse(
        UUID executionId,
        String status,
        String finalOutput,
        List<Map<String, Object>> steps) {
}
