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
@Table(name = "executions")
public class Execution {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExecutionStatus status = ExecutionStatus.PENDING;

    @Column(name = "initial_input", nullable = false, columnDefinition = "text")
    private String initialInput;

    @Column(name = "final_output", columnDefinition = "text")
    private String finalOutput;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    protected Execution() {
    }

    public Execution(Pipeline pipeline, String initialInput) {
        this.pipeline = pipeline;
        this.initialInput = initialInput;
    }

    public void markRunning() {
        this.status = ExecutionStatus.RUNNING;
        this.startedAt = Instant.now();
    }

    public void markCompleted(String finalOutput) {
        this.status = ExecutionStatus.COMPLETED;
        this.finalOutput = finalOutput;
        this.finishedAt = Instant.now();
    }

    public void markFailed(String errorMessage) {
        this.status = ExecutionStatus.FAILED;
        this.errorMessage = errorMessage;
        this.finishedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Pipeline getPipeline() {
        return pipeline;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public String getInitialInput() {
        return initialInput;
    }

    public String getFinalOutput() {
        return finalOutput;
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
