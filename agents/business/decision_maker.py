from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class DecisionMakerAgent(UniversalAgent):
    """Central coordinator and autonomous decision-maker.

    Uses multi-criteria decision analysis and autonomy thresholds to select options.
    """

    def __init__(
        self,
        agent_id: str = "decision-maker-001",
        role: str = "Central coordination and autonomous decision-making",
        model: str = "openai/gpt-5-chat",
    ) -> None:
        super().__init__(agent_id, role, model)
        self.autonomy_level = 7  # Default to high autonomy
        self.criteria_weights: dict[str, float] = {
            "cost": 0.2,
            "time": 0.2,
            "quality": 0.25,
            "risk": 0.2,
            "maintainability": 0.15,
        }

    @tool
    def make_decision(
        self,
        context: dict[str, Any],
        options: list[str],
        constraints: dict[str, Any],
    ) -> dict[str, Any]:
        """Evaluate options and make a decision based on autonomy level.

        Returns a structured decision payload with scores and rationale.
        """
        scores = self.evaluate_options(options, self.criteria_weights, constraints)

        if self.get_decision_complexity(context) > self.autonomy_level:
            return self.escalate_to_user(context, options, scores)

        decision = self.select_best_option(scores)
        self.log_decision(decision, context, "Autonomous decision based on evaluation")
        return {"decision": decision, "scores": scores}

    def evaluate_options(
        self, options: list[str], criteria_weights: dict[str, float], constraints: dict[str, Any]
    ) -> dict[str, dict[str, float]]:
        """Score options against weighted criteria. Placeholder for model-assisted eval."""
        self.logger.info("Evaluating %d options with constraints=%s", len(options), constraints)
        scores: dict[str, dict[str, float]] = {}
        for option in options:
            # Dummy heuristic: uniform mid-high score, reduced by constraint penalties
            base_scores = {c: 0.8 for c in criteria_weights}
            if constraints.get("budget") == "tight":
                base_scores["cost"] -= 0.2
            if constraints.get("deadline") == "aggressive":
                base_scores["time"] -= 0.15
            scores[option] = base_scores
        return scores

    def get_decision_complexity(self, context: dict[str, Any]) -> int:
        """Assess decision complexity from context; higher requires more autonomy."""
        complexity = 5
        if context.get("stakeholders", 1) > 5:
            complexity += 2
        if context.get("risk_profile") == "high":
            complexity += 2
        return min(complexity, 10)

    def escalate_to_user(
        self, context: dict[str, Any], options: list[str], scores: dict[str, dict[str, float]]
    ) -> dict[str, Any]:
        self.logger.warning("Escalating decision due to complexity; options=%s", options)
        return {"action": "escalate", "context": context, "options": options, "scores": scores}

    def select_best_option(self, scores: dict[str, dict[str, float]]) -> str:
        """Select best option by weighted sum across criteria."""
        best_option = None
        best_score = float("-inf")
        for option, criterion_scores in scores.items():
            weighted = sum(criterion_scores[c] * w for c, w in self.criteria_weights.items())
            if weighted > best_score:
                best_score = weighted
                best_option = option
        assert best_option is not None
        return best_option

    def log_decision(self, decision: str, context: dict[str, Any], reasoning: str) -> None:
        self.logger.info("Decision=%s | context=%s | reasoning=%s", decision, context, reasoning)
