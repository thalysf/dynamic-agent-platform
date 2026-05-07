package com.thalys.agentflow.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thalys.agentflow.dto.ExecutionRequest;
import com.thalys.agentflow.dto.ExecutionResponse;
import com.thalys.agentflow.service.ExecutionService;

import jakarta.validation.Valid;

@RestController
public class ExecutionController {

    private final ExecutionService executionService;

    public ExecutionController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    @PostMapping("/api/projects/{projectId}/pipelines/{pipelineId}/executions")
    ResponseEntity<ExecutionResponse> run(@PathVariable UUID projectId, @PathVariable UUID pipelineId,
            @Valid @RequestBody ExecutionRequest request) {
        ExecutionResponse response = executionService.run(projectId, pipelineId, request);
        return ResponseEntity.created(URI.create("/api/executions/" + response.id())).body(response);
    }

    @GetMapping("/api/projects/{projectId}/pipelines/{pipelineId}/executions")
    List<ExecutionResponse> findAll(@PathVariable UUID projectId, @PathVariable UUID pipelineId) {
        return executionService.findAll(projectId, pipelineId);
    }

    @GetMapping("/api/executions/{executionId}")
    ExecutionResponse findById(@PathVariable UUID executionId) {
        return executionService.findById(executionId);
    }
}
