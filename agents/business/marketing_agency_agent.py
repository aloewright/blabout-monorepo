from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class MarketingAgencyAgent(UniversalAgent):
    """Marketing agency multi-role agent.

    Inspired by the ADK sample, this agent crafts campaigns, slogans, and content
    calendars.
    """

    def __init__(
        self,
        agent_id: str = "marketing-agency-001",
        role: str = "Create marketing campaigns and content",
        model: str = "openai/gpt-5-chat",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def create_campaign(self, spec: dict[str, Any]) -> dict[str, Any]:
        """Create a campaign plan (placeholder).

        Args:
            spec: {"product": str, "audience": str, "channels": [..], ...}
        Returns:
            A campaign strategy with messaging pillars and a sample calendar.
        """
        product = spec.get("product", "product")
        audience = spec.get("audience", "audience")
        channels = spec.get("channels", ["social", "email"])  # type: ignore[assignment]
        self.logger.info("Campaign for %s -> %s via %d channels", product, audience, len(channels))
        return {
            "strategy": {
                "product": product,
                "audience": audience,
                "pillars": ["Trust", "Innovation", "Value"],
                "channels": channels,
            },
            "calendar": [{"day": 1, "channel": channels[0], "content": "Teaser post"}],
        }
