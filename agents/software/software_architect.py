from agents.shared.base_agent import UniversalAgent, tool


class SoftwareArchitectAgent(UniversalAgent):
    """System design and architectural decisions agent."""

    def __init__(
        self,
        agent_id: str = "architect-001",
        role: str = "System design and architectural decisions",
        model: str = "google/gemini-2.5-pro",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def evaluate_architecture_decision(
        self, requirement: str, options: list[str]
    ) -> dict[str, float | str]:
        """Evaluate architectural options based on weighted criteria and return the winner."""
        criteria = {
            "scalability": 0.25,
            "maintainability": 0.20,
            "performance": 0.20,
            "security": 0.15,
            "cost": 0.10,
            "teamexpertise": 0.10,
        }

        scores: dict[str, float] = {}
        for option in options:
            scores[option] = self.calculate_weighted_score(option, criteria)

        best = self.select_best_option(scores)
        return {"best_option": best, **scores}

    def calculate_weighted_score(self, option: str, criteria: dict[str, float]) -> float:
        # Placeholder for scoring logic; model-assisted in production
        self.logger.info("Scoring architecture option=%s", option)
        base = 0.0
        for weight in criteria.values():
            base += weight * 0.8
        return base

    def select_best_option(self, scores: dict[str, float]) -> str:
        return max(scores, key=scores.get)
