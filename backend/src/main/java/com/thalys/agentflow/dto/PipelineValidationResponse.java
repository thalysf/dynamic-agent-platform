package com.thalys.agentflow.dto;

import java.util.List;

public record PipelineValidationResponse(
        boolean valid,
        List<String> errors) {
}
