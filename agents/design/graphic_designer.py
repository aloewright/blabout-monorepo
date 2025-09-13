from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class GraphicDesignerAgent(UniversalAgent):
    """Visual asset creation and brand consistency."""

    def __init__(
        self,
        agent_id: str = "graphic-designer-001",
        role: str = "Visual asset creation and brand consistency",
        model: str = "openai/gpt-5-chat",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def create_assets(self, requirements: dict[str, Any]) -> dict[str, Any]:
        """Create a minimal asset set based on requirements (placeholder)."""
        brand = requirements.get("brand", "brand")
        self.logger.info("Creating assets for brand=%s", brand)
        return {"assets": ["logo.svg", "icon.png"], "brand": brand}
