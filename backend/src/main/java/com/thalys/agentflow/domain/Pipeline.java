package com.thalys.agentflow.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pipelines")
public class Pipeline {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false, columnDefinition = "text")
    private String nodesJson = "[]";

    @Column(nullable = false, columnDefinition = "text")
    private String edgesJson = "[]";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Pipeline() {
    }

    public Pipeline(Project project, String name, String description, String nodesJson, String edgesJson) {
        this.project = project;
        update(name, description, nodesJson, edgesJson);
    }

    public void update(String name, String description, String nodesJson, String edgesJson) {
        this.name = name;
        this.description = description;
        this.nodesJson = nodesJson == null || nodesJson.isBlank() ? "[]" : nodesJson;
        this.edgesJson = edgesJson == null || edgesJson.isBlank() ? "[]" : edgesJson;
    }

    @PreUpdate
    void touchUpdatedAt() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getNodesJson() {
        return nodesJson;
    }

    public String getEdgesJson() {
        return edgesJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
