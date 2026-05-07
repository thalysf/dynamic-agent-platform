from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class InitialInput(BaseModel):
    content: str
    attachments: list[Any] = Field(default_factory=list)


class PipelinePayload(BaseModel):
    id: UUID
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class AgentPayload(BaseModel):
    id: UUID
    projectId: UUID
    name: str
    description: str | None = None
    systemPrompt: str
    agentType: str
    modelProvider: str
    modelName: str
    temperature: float
    allowedTools: set[str] = Field(default_factory=set)


class OrchestrationRunRequest(BaseModel):
    executionId: UUID
    projectId: UUID
    pipeline: PipelinePayload
    agents: list[AgentPayload] = Field(default_factory=list)
    initialInput: InitialInput


class OrchestrationStep(BaseModel):
    index: int
    agentId: UUID | None = None
    agentName: str
    status: str
    input: str
    output: str
    toolCalls: list[dict[str, Any]] = Field(default_factory=list)


class OrchestrationRunResponse(BaseModel):
    executionId: UUID
    status: str
    finalOutput: str
    steps: list[OrchestrationStep] = Field(default_factory=list)
