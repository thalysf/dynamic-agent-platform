package com.thalys.agentflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.thalys.agentflow.domain.Project;
import com.thalys.agentflow.dto.ProjectRequest;
import com.thalys.agentflow.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void createsProjectTrimmingName() {
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = projectService.create(new ProjectRequest("  Study Lab  ", "Desc"));

        assertThat(response.name()).isEqualTo("Study Lab");
        assertThat(response.description()).isEqualTo("Desc");
        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Study Lab");
    }

    @Test
    void throwsWhenProjectDoesNotExist() {
        UUID projectId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.findById(projectId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(projectId.toString());
    }
}
