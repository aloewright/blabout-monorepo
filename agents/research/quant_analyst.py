from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class QuantAnalystAgent(UniversalAgent):
    """Financial analysis and cost optimization."""

    def __init__(
        self,
        agent_id: str = "quant-analyst-001",
        role: str = "Financial analysis and cost optimization",
        model: str = "anthropic/claude-4-sonnet",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def analyze_cost(self, project: dict[str, Any]) -> dict[str, Any]:
        """Analyze the cost of a project (placeholder)."""
        name = project.get("name", "project")
        self.logger.info("Analyzing cost of project: %s", name)
        return {"project": name, "cost": 100000}
