"""Base agent abstractions and utilities.

Provides:
- Pydantic models for AgentState and Message
- A @tool decorator to mark callable tools
- UniversalAgent base with structured logging and ADK adapter helper
"""

from __future__ import annotations

import json
import os
import uuid
from collections.abc import Callable, Iterable
from datetime import datetime
from enum import Enum
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field

import logging

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s %(levelname)s [%(name)s] %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

# Load environment variables if a .env exists
load_dotenv()


class Status(str, Enum):
    active = "active"
    idle = "idle"
    busy = "busy"
    error = "error"
    maintenance = "maintenance"


class MessageType(str, Enum):
    request = "request"
    response = "response"
    notification = "notification"
    error = "error"


class Priority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class AgentState(BaseModel):
    status: Status = Status.idle
    current_task: str | None = None
    resource_utilization: dict[str, Any] = Field(default_factory=dict)
    dependencies: list[str] = Field(default_factory=list)
    performance_metrics: dict[str, Any] = Field(default_factory=dict)


class Message(BaseModel):
    message_id: str
    sender: str
    recipient: str
    message_type: MessageType
    priority: Priority
    payload: dict[str, Any]
    timestamp: str
    requires_response: bool
    deadline: str | None = None


def tool(func: Callable) -> Callable:
    """Decorator to mark class methods as agent tools and auto-log actions.

    - Marks the function so adapters can discover it.
    - Wraps the function to append an action entry after successful execution.
    """

    setattr(func, "__is_tool__", True)

    def wrapper(self: UniversalAgent, *args: Any, **kwargs: Any):  # type: ignore[name-defined]
        result = func(self, *args, **kwargs)
        try:
            # Append a lightweight action log line to agents/AGENT_ACTIONS.md
            try:
                project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                log_path = os.path.join(project_root, 'agents', 'AGENT_ACTIONS.md')
                os.makedirs(os.path.dirname(log_path), exist_ok=True)
                with open(log_path, 'a', encoding='utf-8') as lf:
                    lf.write(f"- {datetime.utcnow().isoformat()} | {self.agent_id}.{func.__name__}: "
                             f"{{\"args\": \"{str(args)[:120]}\", \"kwargs\": {json.dumps({k: type(v).__name__ for k, v in kwargs.items()})}}}\n")
            except Exception:
                pass
        except Exception:  # best-effort logging
            self.logger.debug("Failed to append action for %s", func.__name__)
        return result

    # Keep a reference to the original for reflection if needed
    setattr(wrapper, "__is_tool__", True)
    setattr(wrapper, "__wrapped__", func)
    return wrapper


class UniversalAgent:
    """Universal base class for all specialized agents.

    Attributes:
        agent_id: Stable identifier for the agent
        role: Human-readable role/description
        model: The preferred model identifier (e.g., provider/model)
    """

    def __init__(self, agent_id: str, role: str, model: str) -> None:
        self.agent_id = agent_id
        self.role = role
        self.model = model or os.getenv("AGENT_MODEL", "gemini-2.0-flash")
        self.state = AgentState()
        self.logger = get_logger(self.__class__.__name__)

    def tool_methods(self) -> list[Callable]:
        """Return a list of bound methods annotated with @tool."""
        methods: list[Callable] = []
        for attr in dir(self):
            if attr.startswith("_"):
                continue
            candidate = getattr(self, attr)
            if callable(candidate) and getattr(candidate, "__is_tool__", False):
                methods.append(candidate)
        return methods

    def send_message(
        self,
        recipient: str,
        message_type: MessageType,
        payload: dict[str, Any],
        priority: Priority = Priority.medium,
        requires_response: bool = False,
        deadline: str | None = None,
    ) -> Message:
        message = Message(
            message_id=str(uuid.uuid4()),
            sender=self.agent_id,
            recipient=recipient,
            message_type=message_type,
            priority=priority,
            payload=payload,
            timestamp=datetime.utcnow().isoformat(),
            requires_response=requires_response,
            deadline=deadline,
        )
        # In a real implementation, this would publish to a bus/queue.
        self.logger.info(
            "send_message | recipient=%s | type=%s | priority=%s | payload=%s",
            recipient,
            message_type,
            priority,
            json.dumps(message.payload),
        )
        return message

    def update_state(self, **kwargs: Any) -> AgentState:
        """Update agent state fields safely via Pydantic model."""
        updated = self.state.model_copy(update=kwargs)
        self.state = updated
        self.logger.debug("state_updated | %s", updated.model_dump())
        return self.state

    def get_state(self) -> dict[str, Any]:
        return self.state.model_dump()

    def as_adk_agent(
        self,
        instruction: str | None = None,
        tools: Iterable[Callable] | None = None,
        description: str | None = None,
    ) -> Any:
        """Create a google ADK Agent instance from this agent.

        Note: This uses a simple callable list for tools; depending on the ADK version,
        you may pass ADK Tool objects. This prepares the structure and defaults to
        annotated tool methods.
        """
        try:
            from google.adk.agents import Agent  # type: ignore
        except Exception as exc:  # pragma: no cover
            self.logger.error("Failed importing ADK Agent: %s", exc)
            raise

        selected_tools = list(tools or self.tool_methods())
        adk_agent = Agent(
            name=self.agent_id,
            model=self.model,
            description=description or self.role,
            instruction=instruction
            or "You are a helpful agent in a multi-agent system. Use tools when helpful.",
            tools=selected_tools,
        )
        return adk_agent
