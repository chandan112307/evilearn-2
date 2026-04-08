"""Verification Agent — Evaluates claim correctness using evidence."""


class VerificationAgent:
    """Evaluates whether claims are supported by retrieved evidence.

    Assigns status and confidence score based ONLY on evidence
    retrieved from documents. Does NOT use external knowledge,
    assumptions, or interpretive reasoning.

    Status Definitions:
        supported: Evidence clearly confirms the claim (high relevance).
        weakly_supported: Partial or indirect support from evidence.
        unsupported: No supporting evidence or contradiction found.

    Confidence Scale:
        High (0.8–1.0): Strong direct match in evidence.
        Medium (0.4–0.7): Partial match in evidence.
        Low (0.0–0.3): No support or weak match.
    """

    # Thresholds aligned with the system prompt confidence scale
    HIGH_THRESHOLD = 0.7
    MEDIUM_THRESHOLD = 0.4

    def run(self, claims: list[dict], evidence_map: dict) -> list[dict]:
        """Verify each claim against its evidence.

        Args:
            claims: List of claim dicts with claim_id and claim_text.
            evidence_map: Dict mapping claim_id to list of evidence objects.

        Returns:
            List of verification result dicts, one per claim.
        """
        results = []

        for claim in claims:
            claim_id = claim["claim_id"]
            claim_text = claim["claim_text"]
            evidence_list = evidence_map.get(claim_id, [])

            verification = self._verify_claim(evidence_list)
            verification["claim_id"] = claim_id
            verification["claim_text"] = claim_text
            verification["evidence"] = [
                {
                    "snippet": e.get("text_snippet", ""),
                    "page_number": e.get("page_number", 0),
                }
                for e in evidence_list[:3]
            ]

            results.append(verification)

        return results

    def _verify_claim(self, evidence_list: list[dict]) -> dict:
        """Verify a single claim based solely on retrieved evidence relevance.

        Uses only the relevance_score returned by ChromaDB similarity search.
        No interpretive reasoning or composite scoring is performed.

        Args:
            evidence_list: Retrieved evidence chunks from ChromaDB.

        Returns:
            Dict with status and confidence_score.
        """
        # No evidence → unsupported with low confidence
        if not evidence_list:
            return {
                "status": "unsupported",
                "confidence_score": 0.1,
            }

        # Use the highest relevance score from ChromaDB as confidence
        max_relevance = max(
            e.get("relevance_score", 0.0) for e in evidence_list
        )

        # Determine status based on evidence relevance thresholds
        if max_relevance >= self.HIGH_THRESHOLD:
            return {
                "status": "supported",
                "confidence_score": round(min(max_relevance, 1.0), 2),
            }
        elif max_relevance >= self.MEDIUM_THRESHOLD:
            return {
                "status": "weakly_supported",
                "confidence_score": round(max_relevance, 2),
            }
        else:
            return {
                "status": "unsupported",
                "confidence_score": round(max(max_relevance, 0.05), 2),
            }
