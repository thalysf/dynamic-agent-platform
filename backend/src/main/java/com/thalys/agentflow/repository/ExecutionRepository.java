package com.thalys.agentflow.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.thalys.agentflow.domain.Execution;

public interface ExecutionRepository extends JpaRepository<Execution, UUID> {
    List<Execution> findByPipelineIdOrderByStartedAtDesc(UUID pipelineId);
}
