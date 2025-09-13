from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class InteractiveMotionDesignerAgent(UniversalAgent):
    """Animation and interactive element creation."""

    def __init__(
        self,
        agent_id: str = "motion-designer-001",
        role: str = "Animation and interactive element creation",
        model: str = "anthropic/claude-4-sonnet",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def create_animation(self, requirements: dict[str, Any]) -> dict[str, Any]:
        """Create an animation artifact definition (placeholder)."""
        self.logger.info("Creating animation %s", requirements.get("name", "animation"))
        return {"animation": "animation.json", "format": "lottie"}
