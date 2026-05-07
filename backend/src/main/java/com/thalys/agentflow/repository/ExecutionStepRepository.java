package com.thalys.agentflow.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.thalys.agentflow.domain.ExecutionStep;

public interface ExecutionStepRepository extends JpaRepository<ExecutionStep, UUID> {
    List<ExecutionStep> findByExecutionIdOrderByStepIndexAsc(UUID executionId);
}
