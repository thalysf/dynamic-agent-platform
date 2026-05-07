package com.thalys.agentflow.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "execution_steps")
public class ExecutionStep {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "execution_id", nullable = false)
    private Execution execution;

    @Column(name = "step_index", nullable = false)
    private int stepIndex;

    @Column(name = "node_id", length = 120)
    private String nodeId;

    @Column(name = "agent_id")
    private UUID agentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExecutionStatus status;

    @Column(name = "input_value", columnDefinition = "text")
    private String input;

    @Column(name = "output_value", columnDefinition = "text")
    private String output;

    @Column(name = "tool_calls", columnDefinition = "text")
    private String toolCalls;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    protected ExecutionStep() {
    }

    public ExecutionStep(Execution execution, int stepIndex, String nodeId, UUID agentId, ExecutionStatus status,
            String input, String output, String toolCalls, Instant startedAt, Instant finishedAt, String errorMessage) {
        this.execution = execution;
        this.stepIndex = stepIndex;
        this.nodeId = nodeId;
        this.agentId = agentId;
        this.status = status;
        this.input = input;
        this.output = output;
        this.toolCalls = toolCalls;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.errorMessage = errorMessage;
    }

    public UUID getId() {
        return id;
    }

    public Execution getExecution() {
        return execution;
    }

    public int getStepIndex() {
        return stepIndex;
    }

    public String getNodeId() {
        return nodeId;
    }

    public UUID getAgentId() {
        return agentId;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public String getInput() {
        return input;
    }

    public String getOutput() {
        return output;
    }

    public String getToolCalls() {
        return toolCalls;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}
