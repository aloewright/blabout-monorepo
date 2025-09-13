from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class FrontendDesignerAgent(UniversalAgent):
    """Visual design with technical implementation focus."""

    def __init__(
        self,
        agent_id: str = "frontend-designer-001",
        role: str = "Visual design with technical implementation focus",
        model: str = "openai/gpt-5-chat",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def create_visual_design(self, wireframes: list[str] | dict[str, Any]) -> dict[str, Any]:
        """Create a visual design artifact (placeholder)."""
        pages = wireframes if isinstance(wireframes, list) else wireframes.get("pages", [])
        self.logger.info("Creating visual design for %d wireframe pages", len(pages))
        return {"visual_design": "design.fig", "pages": len(pages)}
