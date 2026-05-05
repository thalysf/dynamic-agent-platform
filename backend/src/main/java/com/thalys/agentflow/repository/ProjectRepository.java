package com.thalys.agentflow.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.thalys.agentflow.domain.Project;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
}
