from agents.shared.base_agent import UniversalAgent, tool


class SiteReliabilityEngineerAgent(UniversalAgent):
    """System reliability, monitoring, and incident response."""

    def __init__(
        self,
        agent_id: str = "sre-001",
        role: str = "System reliability, monitoring, and incident response",
        model: str = "google/gemini-2.5-pro",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def monitor_system(self) -> dict[str, str]:
        """Monitor the system for reliability and performance (placeholder)."""
        self.logger.info("Monitoring system...")
        return {"status": "healthy"}
