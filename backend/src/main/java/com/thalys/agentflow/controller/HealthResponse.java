package com.thalys.agentflow.controller;

import java.time.Instant;

public record HealthResponse(
        String status,
        String service,
        Instant timestamp
) {
}
