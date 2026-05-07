package com.thalys.agentflow.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thalys.agentflow.dto.PipelineRequest;
import com.thalys.agentflow.dto.PipelineResponse;
import com.thalys.agentflow.service.PipelineService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects/{projectId}/pipelines")
public class PipelineController {

    private final PipelineService pipelineService;

    public PipelineController(PipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    @PostMapping
    ResponseEntity<PipelineResponse> create(@PathVariable UUID projectId, @Valid @RequestBody PipelineRequest request) {
        PipelineResponse response = pipelineService.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/pipelines/" + response.id()))
                .body(response);
    }

    @GetMapping
    List<PipelineResponse> findAll(@PathVariable UUID projectId) {
        return pipelineService.findAll(projectId);
    }

    @GetMapping("/{pipelineId}")
    PipelineResponse findById(@PathVariable UUID projectId, @PathVariable UUID pipelineId) {
        return pipelineService.findById(projectId, pipelineId);
    }

    @PutMapping("/{pipelineId}")
    PipelineResponse update(@PathVariable UUID projectId, @PathVariable UUID pipelineId,
            @Valid @RequestBody PipelineRequest request) {
        return pipelineService.update(projectId, pipelineId, request);
    }

    @DeleteMapping("/{pipelineId}")
    ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID pipelineId) {
        pipelineService.delete(projectId, pipelineId);
        return ResponseEntity.noContent().build();
    }
}
