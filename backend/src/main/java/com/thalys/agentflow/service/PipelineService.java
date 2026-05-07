package com.thalys.agentflow.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thalys.agentflow.domain.Pipeline;
import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.PipelineRequest;
import com.thalys.agentflow.dto.PipelineResponse;
import com.thalys.agentflow.repository.PipelineRepository;

@Service
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final ProjectService projectService;

    public PipelineService(PipelineRepository pipelineRepository, ProjectService projectService) {
        this.pipelineRepository = pipelineRepository;
        this.projectService = projectService;
    }

    @Transactional
    public PipelineResponse create(UUID projectId, PipelineRequest request) {
        Project project = projectService.findProject(projectId);
        Pipeline pipeline = new Pipeline(project, request.name().trim(), request.description(), request.nodesJson(),
                request.edgesJson());
        return PipelineResponse.from(pipelineRepository.save(pipeline));
    }

    @Transactional(readOnly = true)
    public List<PipelineResponse> findAll(UUID projectId) {
        projectService.findProject(projectId);
        return pipelineRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(PipelineResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PipelineResponse findById(UUID projectId, UUID pipelineId) {
        return PipelineResponse.from(findPipeline(projectId, pipelineId));
    }

    @Transactional
    public PipelineResponse update(UUID projectId, UUID pipelineId, PipelineRequest request) {
        Pipeline pipeline = findPipeline(projectId, pipelineId);
        pipeline.update(request.name().trim(), request.description(), request.nodesJson(), request.edgesJson());
        return PipelineResponse.from(pipelineRepository.save(pipeline));
    }

    @Transactional
    public void delete(UUID projectId, UUID pipelineId) {
        Pipeline pipeline = findPipeline(projectId, pipelineId);
        pipelineRepository.delete(pipeline);
    }

    public Pipeline findPipeline(UUID projectId, UUID pipelineId) {
        return pipelineRepository.findByIdAndProjectId(pipelineId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline not found: " + pipelineId));
    }
}
