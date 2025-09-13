from typing import Any

from agents.shared.base_agent import UniversalAgent, tool


class EngineeringManagerAgent(UniversalAgent):
    """Technical leadership and team coordination."""

    def __init__(
        self,
        agent_id: str = "eng-manager-001",
        role: str = "Technical leadership and team coordination",
        model: str = "anthropic/claude-4-sonnet",
    ) -> None:
        super().__init__(agent_id, role, model)

    @tool
    def review_code(self, pull_request: dict[str, Any]) -> dict[str, Any]:
        """Review a pull request for quality, security, and performance."""
        code = pull_request.get("code", "")
        quality_score = self.analyze_code_quality(code)
        security_issues = self.scan_security_vulnerabilities(code)
        performance_impact = self.assess_performance_impact(code)

        feedback = self.generate_review_feedback(quality_score, security_issues, performance_impact)

        if self.meets_quality_standards(quality_score, security_issues):
            return self.approve_with_feedback(feedback)
        return self.request_changes(feedback)

    def analyze_code_quality(self, code: str) -> float:
        # Placeholder: compute a maintainability-like score
        length_penalty = min(len(code) / 10000.0, 0.2)
        return max(0.0, 0.95 - length_penalty)

    def scan_security_vulnerabilities(self, code: str) -> list[str]:
        # Placeholder for basic checks
        findings: list[str] = []
        if "eval(" in code:
            findings.append("Avoid eval usage")
        return findings

    def assess_performance_impact(self, code: str) -> str:
        # Placeholder heuristic
        return "low" if len(code) < 5000 else "moderate"

    def generate_review_feedback(
        self,
        quality_score: float,
        security_issues: list[str],
        performance_impact: str,
    ) -> str:
        return (
            f"Quality Score: {quality_score:.2f}, Security Issues: {security_issues}, "
            f"Performance Impact: {performance_impact}"
        )

    def meets_quality_standards(self, quality_score: float, security_issues: list[str]) -> bool:
        return quality_score >= 0.8 and not security_issues

    def approve_with_feedback(self, feedback: str) -> dict[str, Any]:
        return {"status": "approved", "feedback": feedback}

    def request_changes(self, feedback: str) -> dict[str, Any]:
        return {"status": "changes_requested", "feedback": feedback}
