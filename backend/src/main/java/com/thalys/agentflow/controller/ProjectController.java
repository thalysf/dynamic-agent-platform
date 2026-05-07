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

import com.thalys.agentflow.dto.ProjectRequest;
import com.thalys.agentflow.dto.ProjectResponse;
import com.thalys.agentflow.service.ProjectService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.create(request);
        return ResponseEntity.created(URI.create("/api/projects/" + response.id())).body(response);
    }

    @GetMapping
    List<ProjectResponse> findAll() {
        return projectService.findAll();
    }

    @GetMapping("/{projectId}")
    ProjectResponse findById(@PathVariable UUID projectId) {
        return projectService.findById(projectId);
    }

    @PutMapping("/{projectId}")
    ProjectResponse update(@PathVariable UUID projectId, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(projectId, request);
    }

    @DeleteMapping("/{projectId}")
    ResponseEntity<Void> delete(@PathVariable UUID projectId) {
        projectService.delete(projectId);
        return ResponseEntity.noContent().build();
    }
}
