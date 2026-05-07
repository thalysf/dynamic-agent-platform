package com.thalys.agentflow.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thalys.agentflow.domain.Agent;
import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.AgentRequest;
import com.thalys.agentflow.dto.AgentResponse;
import com.thalys.agentflow.repository.AgentRepository;

@Service
public class AgentService {

    private final AgentRepository agentRepository;
    private final ProjectService projectService;

    public AgentService(AgentRepository agentRepository, ProjectService projectService) {
        this.agentRepository = agentRepository;
        this.projectService = projectService;
    }

    @Transactional
    public AgentResponse create(UUID projectId, AgentRequest request) {
        Project project = projectService.findProject(projectId);
        Agent agent = new Agent(project, request.name().trim(), request.description(), request.systemPrompt().trim(),
                request.agentType(), request.modelProvider(), request.modelName(), request.temperature(),
                normalizeTools(request.allowedTools()));
        return AgentResponse.from(agentRepository.save(agent));
    }

    @Transactional(readOnly = true)
    public List<AgentResponse> findAll(UUID projectId) {
        projectService.findProject(projectId);
        return agentRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(AgentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AgentResponse findById(UUID projectId, UUID agentId) {
        return AgentResponse.from(findAgent(projectId, agentId));
    }

    @Transactional
    public AgentResponse update(UUID projectId, UUID agentId, AgentRequest request) {
        Agent agent = findAgent(projectId, agentId);
        agent.update(request.name().trim(), request.description(), request.systemPrompt().trim(), request.agentType(),
                request.modelProvider(), request.modelName(), request.temperature(), normalizeTools(request.allowedTools()));
        return AgentResponse.from(agentRepository.save(agent));
    }

    @Transactional
    public void delete(UUID projectId, UUID agentId) {
        Agent agent = findAgent(projectId, agentId);
        agentRepository.delete(agent);
    }

    public Agent findAgent(UUID projectId, UUID agentId) {
        return agentRepository.findByIdAndProjectId(agentId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + agentId));
    }

    private Set<String> normalizeTools(Set<String> tools) {
        if (tools == null) {
            return Set.of();
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String tool : tools) {
            if (tool != null && !tool.isBlank()) {
                normalized.add(tool.trim());
            }
        }
        return normalized;
    }
}
