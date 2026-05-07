package com.thalys.agentflow.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.thalys.agentflow.domain.Pipeline;

public interface PipelineRepository extends JpaRepository<Pipeline, UUID> {
    List<Pipeline> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Pipeline> findByIdAndProjectId(UUID id, UUID projectId);
}
