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

import com.thalys.agentflow.dto.AgentRequest;
import com.thalys.agentflow.dto.AgentResponse;
import com.thalys.agentflow.service.AgentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects/{projectId}/agents")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping
    ResponseEntity<AgentResponse> create(@PathVariable UUID projectId, @Valid @RequestBody AgentRequest request) {
        AgentResponse response = agentService.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/agents/" + response.id()))
                .body(response);
    }

    @GetMapping
    List<AgentResponse> findAll(@PathVariable UUID projectId) {
        return agentService.findAll(projectId);
    }

    @GetMapping("/{agentId}")
    AgentResponse findById(@PathVariable UUID projectId, @PathVariable UUID agentId) {
        return agentService.findById(projectId, agentId);
    }

    @PutMapping("/{agentId}")
    AgentResponse update(@PathVariable UUID projectId, @PathVariable UUID agentId,
            @Valid @RequestBody AgentRequest request) {
        return agentService.update(projectId, agentId, request);
    }

    @DeleteMapping("/{agentId}")
    ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID agentId) {
        agentService.delete(projectId, agentId);
        return ResponseEntity.noContent().build();
    }
}
