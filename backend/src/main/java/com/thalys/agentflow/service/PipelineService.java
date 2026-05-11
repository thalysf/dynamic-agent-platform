package com.thalys.agentflow.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thalys.agentflow.domain.Pipeline;
import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.PipelineRequest;
import com.thalys.agentflow.dto.PipelineResponse;
import com.thalys.agentflow.dto.PipelineValidationResponse;
import com.thalys.agentflow.repository.PipelineRepository;

@Service
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final ProjectService projectService;
    private final PipelineGraphValidator graphValidator;

    public PipelineService(PipelineRepository pipelineRepository, ProjectService projectService,
            PipelineGraphValidator graphValidator) {
        this.pipelineRepository = pipelineRepository;
        this.projectService = projectService;
        this.graphValidator = graphValidator;
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

    @Transactional(readOnly = true)
    public PipelineValidationResponse validate(UUID projectId, UUID pipelineId) {
        Pipeline pipeline = findPipeline(projectId, pipelineId);
        return validate(projectId, pipeline.getNodesJson(), pipeline.getEdgesJson());
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

    public PipelineValidationResponse validate(UUID projectId, String nodesJson, String edgesJson) {
        projectService.findProject(projectId);
        return graphValidator.validate(projectId, nodesJson, edgesJson);
    }
}
