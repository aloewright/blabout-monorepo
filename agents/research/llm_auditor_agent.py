from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class LLMAuditorAgent(UniversalAgent):
    """LLM output/prompt auditor agent.

    Inspired by the ADK sample, this agent audits prompts or model outputs for
    policy compliance, safety, and quality issues.
    """

    def __init__(
        self,
        agent_id: str = "llm-auditor-001",
        role: str = "Audit LLM prompts and outputs for compliance and safety",
        model: str = "anthropic/claude-4-sonnet",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def audit(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Audit a prompt or output.

        Args:
            payload: {"type": "prompt"|"output", "content": str, "policy": optional dict}
        Returns:
            Structured audit report with issues and severities (placeholder).
        """
        content_type = payload.get("type", "prompt")
        self.logger.info("Auditing %s", content_type)
        issues: list[dict[str, Any]] = []
        text = payload.get("content", "")
        if "password" in text.lower():
            issues.append({"rule": "secrets", "severity": "high", "detail": "Mentions password"})
        return {"type": content_type, "issues": issues, "score": 0.95 if not issues else 0.6}
