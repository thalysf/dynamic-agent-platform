package com.thalys.agentflow.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.ProjectRequest;
import com.thalys.agentflow.dto.ProjectResponse;
import com.thalys.agentflow.repository.ProjectRepository;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        Project project = new Project(request.name().trim(), request.description());
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findAll() {
        return projectRepository.findAll().stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id) {
        return ProjectResponse.from(findProject(id));
    }

    @Transactional
    public ProjectResponse update(UUID id, ProjectRequest request) {
        Project project = findProject(id);
        project.update(request.name().trim(), request.description());
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public void delete(UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found: " + id);
        }
        projectRepository.deleteById(id);
    }

    public Project findProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }
}
