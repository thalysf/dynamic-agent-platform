package com.thalys.agentflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.thalys.agentflow.domain.Agent;
import com.thalys.agentflow.domain.AgentType;
import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.AgentRequest;
import com.thalys.agentflow.repository.AgentRepository;

@ExtendWith(MockitoExtension.class)
class AgentServiceTest {

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private AgentService agentService;

    @Test
    void createsAgentLinkedToProjectWithDefaultsAndNormalizedTools() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project("Project", null);
        when(projectService.findProject(projectId)).thenReturn(project);
        when(agentRepository.save(any(Agent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AgentRequest request = new AgentRequest(
                " Writer ",
                "Desc",
                " Prompt ",
                null,
                null,
                null,
                null,
                Set.of(" search ", "", "docs"));

        var response = agentService.create(projectId, request);

        assertThat(response.projectId()).isEqualTo(project.getId());
        assertThat(response.name()).isEqualTo("Writer");
        assertThat(response.systemPrompt()).isEqualTo("Prompt");
        assertThat(response.agentType()).isEqualTo(AgentType.GENERAL);
        assertThat(response.modelProvider()).isEqualTo("groq");
        assertThat(response.temperature()).isEqualByComparingTo(BigDecimal.valueOf(0.70));
        assertThat(response.allowedTools()).containsExactlyInAnyOrder("search", "docs");
    }

    @Test
    void updatesAgentInsideProject() {
        UUID projectId = UUID.randomUUID();
        UUID agentId = UUID.randomUUID();
        Project project = new Project("Project", null);
        Agent agent = new Agent(project, "Old", null, "Old prompt", AgentType.GENERAL, "groq",
                "llama-3.1-70b-versatile", BigDecimal.valueOf(0.7), Set.of());
        when(agentRepository.findByIdAndProjectId(agentId, projectId)).thenReturn(Optional.of(agent));
        when(agentRepository.save(agent)).thenReturn(agent);

        AgentRequest request = new AgentRequest("Critic", null, "Review deeply", AgentType.CRITIC, "groq",
                "llama-3.3-70b-versatile", BigDecimal.valueOf(0.2), Set.of("repo"));

        var response = agentService.update(projectId, agentId, request);

        assertThat(response.name()).isEqualTo("Critic");
        assertThat(response.agentType()).isEqualTo(AgentType.CRITIC);
        assertThat(response.allowedTools()).containsExactly("repo");
    }
}
