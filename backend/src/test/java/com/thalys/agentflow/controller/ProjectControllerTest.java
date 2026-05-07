package com.thalys.agentflow.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.thalys.agentflow.dto.ProjectResponse;
import com.thalys.agentflow.service.ProjectService;

@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @Test
    void createsProject() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(projectService.create(any())).thenReturn(new ProjectResponse(
                projectId, "Project", "Desc", Instant.now(), Instant.now()));

        mockMvc.perform(post("/api/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Project\",\"description\":\"Desc\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/projects/" + projectId))
                .andExpect(jsonPath("$.name", equalTo("Project")));
    }

    @Test
    void rejectsBlankName() throws Exception {
        mockMvc.perform(post("/api/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"description\":\"Desc\"}"))
                .andExpect(status().isBadRequest());
    }
}
