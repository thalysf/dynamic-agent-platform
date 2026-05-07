package com.thalys.agentflow.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.thalys.agentflow.domain.Agent;

public interface AgentRepository extends JpaRepository<Agent, UUID> {
    List<Agent> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Agent> findByIdAndProjectId(UUID id, UUID projectId);
}
