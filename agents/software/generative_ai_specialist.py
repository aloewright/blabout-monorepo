from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class GenerativeAISpecialistAgent(UniversalAgent):
    """AI-generated content integration."""

    def __init__(
        self,
        agent_id: str = "generative-ai-001",
        role: str = "AI-generated content integration",
        model: str = "google/gemini-2.5-pro",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def generate_content(self, prompt: dict[str, Any] | str) -> dict[str, Any]:
        """Generate content (placeholder); returns a simple text artifact."""
        topic = prompt if isinstance(prompt, str) else prompt.get("topic", "content")
        self.logger.info("Generating content for topic=%s", topic)
        return {"type": "text", "content": f"Generated content about {topic}."}
