package com.thalys.agentflow.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "agents")
public class Agent {

    private static final String DEFAULT_MODEL_PROVIDER = "groq";
    private static final String DEFAULT_MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct";

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

    @Column(name = "system_prompt", nullable = false, columnDefinition = "text")
    private String systemPrompt;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", nullable = false, length = 40)
    private AgentType agentType = AgentType.GENERAL;

    @Column(name = "model_provider", nullable = false, length = 40)
    private String modelProvider = DEFAULT_MODEL_PROVIDER;

    @Column(name = "model_name", nullable = false, length = 120)
    private String modelName = DEFAULT_MODEL_NAME;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal temperature = BigDecimal.valueOf(0.70);

    @ElementCollection
    @CollectionTable(name = "agent_allowed_tools", joinColumns = @JoinColumn(name = "agent_id"))
    @Column(name = "tool_name", nullable = false, length = 120)
    private Set<String> allowedTools = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Agent() {
    }

    public Agent(Project project, String name, String description, String systemPrompt, AgentType agentType,
            String modelProvider, String modelName, BigDecimal temperature, Set<String> allowedTools) {
        this.project = project;
        update(name, description, systemPrompt, agentType, modelProvider, modelName, temperature, allowedTools);
    }

    public void update(String name, String description, String systemPrompt, AgentType agentType,
            String modelProvider, String modelName, BigDecimal temperature, Set<String> allowedTools) {
        this.name = name;
        this.description = description;
        this.systemPrompt = systemPrompt;
        this.agentType = agentType == null ? AgentType.GENERAL : agentType;
        this.modelProvider = isBlank(modelProvider) ? DEFAULT_MODEL_PROVIDER : modelProvider;
        this.modelName = isBlank(modelName) ? DEFAULT_MODEL_NAME : modelName;
        this.temperature = temperature == null ? BigDecimal.valueOf(0.70) : temperature;
        this.allowedTools.clear();
        if (allowedTools != null) {
            this.allowedTools.addAll(allowedTools);
        }
    }

    @PreUpdate
    void touchUpdatedAt() {
        this.updatedAt = Instant.now();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
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

    public String getSystemPrompt() {
        return systemPrompt;
    }

    public AgentType getAgentType() {
        return agentType;
    }

    public String getModelProvider() {
        return modelProvider;
    }

    public String getModelName() {
        return modelName;
    }

    public BigDecimal getTemperature() {
        return temperature;
    }

    public Set<String> getAllowedTools() {
        return Set.copyOf(allowedTools);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
