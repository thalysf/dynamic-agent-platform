from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class A2AMessage(BaseModel):
    messageId: UUID = Field(default_factory=uuid4)
    executionId: UUID
    senderAgentId: str
    receiverAgentId: UUID
    content: str
    context: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
