"""EviLearn Validation Pipeline — Graph-native multi-agent system using LangGraph.

ALL agent logic is implemented as pure functions (graph nodes) operating on
shared LangGraph state. There are NO agent classes. Each node reads from state,
performs its single responsibility, and writes ONLY its assigned fields.

Pipeline order (NON-NEGOTIABLE):
    START → planner → claim_extractor → retriever → verifier → explainer → END

Tech stack: LangGraph StateGraph + LLM API (Groq/OpenAI) — nothing else.
"""

import os
import json
import re
import uuid
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, START, END


# ---------------------------------------------------------------------------
# Shared State — every node reads from / writes to this TypedDict
# ---------------------------------------------------------------------------

class PipelineState(TypedDict):
    """Shared state flowing through every node in the LangGraph pipeline."""

    # Injected dependencies (set once before graph.invoke, never mutated by nodes)
    _vector_store: object
    _llm_client: object

    # Pipeline data (each field written by exactly one node)
    raw_input: str
    input_type: str               # written by planner
    pipeline_decision: str        # written by planner
    claims: list[dict]            # written by claim_extractor
    evidence_map: dict            # written by retriever
    verification_results: list[dict]  # written by verifier
    final_results: list[dict]     # written by explainer
    error: Optional[str]


# ---------------------------------------------------------------------------
# Node 1: Planner — detect input type, decide pipeline routing
# ---------------------------------------------------------------------------

def planner_node(state: PipelineState) -> dict:
    """Determine input type (answer / explanation / summary / question).

    Reads: raw_input
    Writes: input_type, pipeline_decision
    """
    raw_input = state["raw_input"]
    if not raw_input or not raw_input.strip():
        raise ValueError("Input text is empty.")

    text_lower = raw_input.strip().lower()

    # Detect question
    if text_lower.endswith("?"):
        input_type = "question"
    else:
        question_starters = [
            "what ", "how ", "why ", "when ", "where ",
            "who ", "which ", "is ", "are ", "do ",
            "does ", "can ", "could ",
        ]
        input_type = "question" if any(
            text_lower.startswith(s) for s in question_starters
        ) else None

    # Detect explanation
    if input_type is None:
        explanation_keywords = [
            "because", "therefore", "this means", "the reason",
            "this is due to", "as a result", "consequently",
        ]
        if any(kw in text_lower for kw in explanation_keywords):
            input_type = "explanation"

    # Detect summary
    if input_type is None:
        summary_keywords = [
            "in summary", "to summarize", "overall",
            "in conclusion", "the main points",
        ]
        if any(kw in text_lower for kw in summary_keywords):
            input_type = "summary"

    # Default to answer
    if input_type is None:
        input_type = "answer"

    return {
        "input_type": input_type,
        "pipeline_decision": "validation",
    }


# ---------------------------------------------------------------------------
# Node 2: Claim Extractor — break text into atomic factual claims
# ---------------------------------------------------------------------------

def claim_extractor_node(state: PipelineState) -> dict:
    """Extract atomic factual claims from user input.

    Uses LLM API when available, falls back to rule-based sentence splitting.

    Reads: raw_input, input_type, _llm_client
    Writes: claims
    """
    text = state["raw_input"].strip()
    input_type = state["input_type"]
    llm_client = state.get("_llm_client")

    if not text:
        return {"claims": []}

    # --- Try LLM-based extraction first ---
    if llm_client:
        try:
            prompt = (
                f"Break the following {input_type} into atomic factual claims.\n"
                "Each claim must:\n"
                "- Represent a single fact\n"
                "- Be independently verifiable\n"
                "- Preserve the original meaning\n\n"
                "Return ONLY a JSON array of strings, each being one claim.\n\n"
                f"Text: {text}\n\nClaims:"
            )
            response = llm_client.chat.completions.create(
                model=os.environ.get("LLM_MODEL", "llama3-8b-8192"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1024,
            )
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                claims_list = json.loads(json_match.group())
                claims = [
                    {"claim_id": str(uuid.uuid4()), "claim_text": c.strip()}
                    for c in claims_list if c.strip()
                ]
                return {"claims": claims}
        except Exception:
            pass  # Fall through to rule-based extraction

    # --- Rule-based fallback: sentence splitting ---
    sentences = re.split(r'(?<=[.!])\s+', text)
    claims = []
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 10:
            continue
        if sentence.endswith("?"):
            continue
        claims.append({
            "claim_id": str(uuid.uuid4()),
            "claim_text": sentence,
        })

    return {"claims": claims}


# ---------------------------------------------------------------------------
# Conditional edge: check if claims were extracted
# ---------------------------------------------------------------------------

def check_claims_extracted(state: PipelineState) -> str:
    """Route to retriever if claims exist, otherwise end."""
    if state.get("claims"):
        return "has_claims"
    return "no_claims"


# ---------------------------------------------------------------------------
# Node 3: Retriever — retrieve document evidence for each claim
# ---------------------------------------------------------------------------

def retriever_node(state: PipelineState) -> dict:
    """Retrieve top-k evidence chunks from ChromaDB for each claim.

    Uses ONLY retrieved documents. Does NOT generate evidence.

    Reads: claims, _vector_store
    Writes: evidence_map
    """
    vector_store = state.get("_vector_store")
    claims = state["claims"]
    evidence_map: dict = {}

    for claim in claims:
        claim_id = claim["claim_id"]
        claim_text = claim["claim_text"]
        try:
            evidence = vector_store.query(query_text=claim_text, top_k=5)
            evidence_map[claim_id] = evidence
        except Exception:
            evidence_map[claim_id] = []

    return {"evidence_map": evidence_map}


# ---------------------------------------------------------------------------
# Node 4: Verifier — evaluate claim status using only evidence relevance
# ---------------------------------------------------------------------------

# Thresholds aligned with system prompt confidence scale
_HIGH_THRESHOLD = 0.7
_MEDIUM_THRESHOLD = 0.4


def verifier_node(state: PipelineState) -> dict:
    """Assign status and confidence to each claim based solely on evidence.

    Status definitions:
        supported       — evidence clearly confirms the claim
        weakly_supported — partial or indirect support
        unsupported     — no supporting evidence or contradiction

    Confidence scale:
        High  (0.8–1.0)  strong direct match
        Medium (0.4–0.7)  partial match
        Low   (0.0–0.3)  no support or weak match

    Reads: claims, evidence_map
    Writes: verification_results
    """
    claims = state["claims"]
    evidence_map = state["evidence_map"]
    results: list[dict] = []

    for claim in claims:
        claim_id = claim["claim_id"]
        claim_text = claim["claim_text"]
        evidence_list = evidence_map.get(claim_id, [])

        # --- Determine status from highest relevance score ---
        if not evidence_list:
            status = "unsupported"
            confidence_score = 0.1
        else:
            max_relevance = max(
                e.get("relevance_score", 0.0) for e in evidence_list
            )
            if max_relevance >= _HIGH_THRESHOLD:
                status = "supported"
                confidence_score = round(min(max_relevance, 1.0), 2)
            elif max_relevance >= _MEDIUM_THRESHOLD:
                status = "weakly_supported"
                confidence_score = round(max_relevance, 2)
            else:
                status = "unsupported"
                confidence_score = round(max(max_relevance, 0.05), 2)

        # Build evidence snippets (top 3)
        evidence_snippets = [
            {
                "snippet": e.get("text_snippet", ""),
                "page_number": e.get("page_number", 0),
            }
            for e in evidence_list[:3]
        ]

        results.append({
            "claim_id": claim_id,
            "claim_text": claim_text,
            "status": status,
            "confidence_score": confidence_score,
            "evidence": evidence_snippets,
        })

    return {"verification_results": results}


# ---------------------------------------------------------------------------
# Node 5: Explainer — generate human-readable explanations
# ---------------------------------------------------------------------------

def explainer_node(state: PipelineState) -> dict:
    """Generate an explanation for each verification result.

    Uses LLM API when available, falls back to rule-based templates.
    Does NOT change the verification decision.

    Reads: verification_results, _llm_client
    Writes: final_results
    """
    llm_client = state.get("_llm_client")
    verification_results = state["verification_results"]
    final_results: list[dict] = []

    for result in verification_results:
        explanation = _explain_with_llm(result, llm_client) if llm_client else None
        if explanation is None:
            explanation = _explain_with_rules(result)

        final_results.append({
            **result,
            "explanation": explanation,
        })

    return {"final_results": final_results}


def _explain_with_llm(result: dict, llm_client) -> Optional[str]:
    """Generate explanation using LLM API. Returns None on failure."""
    try:
        evidence_text = ""
        for i, e in enumerate(result.get("evidence", []), 1):
            evidence_text += (
                f"\n  Evidence {i} (page {e.get('page_number', '?')}): "
                f"{e.get('snippet', '')}"
            )

        prompt = (
            f"Explain why this claim has the status '{result['status']}' "
            f"with confidence {result['confidence_score']}.\n\n"
            f"Claim: {result['claim_text']}\n"
            f"Status: {result['status']}\n"
            f"Confidence: {result['confidence_score']}\n"
            f"Evidence: {evidence_text}\n\n"
            "Write a concise explanation (2-3 sentences) that:\n"
            "1. References the evidence\n"
            "2. Explains why the claim has this status\n"
            "3. Does NOT change the decision\n\n"
            "Explanation:"
        )
        response = llm_client.chat.completions.create(
            model=os.environ.get("LLM_MODEL", "llama3-8b-8192"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=256,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return None


def _explain_with_rules(result: dict) -> str:
    """Generate a rule-based explanation from the verification result."""
    status = result.get("status", "unsupported")
    confidence = result.get("confidence_score", 0)
    evidence = result.get("evidence", [])

    if status == "supported":
        if evidence:
            page_refs = ", ".join(
                f"page {e.get('page_number', '?')}" for e in evidence
            )
            return (
                f"This claim is supported by evidence found in the uploaded "
                f"documents ({page_refs}). The retrieved content closely "
                f"matches the assertion with a confidence score of {confidence}."
            )
        return f"This claim is marked as supported with confidence {confidence}."

    if status == "weakly_supported":
        if evidence:
            page_refs = ", ".join(
                f"page {e.get('page_number', '?')}" for e in evidence
            )
            return (
                f"This claim has partial support from the documents "
                f"({page_refs}). The evidence provides indirect or incomplete "
                f"confirmation with a confidence score of {confidence}."
            )
        return f"This claim has weak support with confidence {confidence}."

    # unsupported
    if evidence:
        return (
            "Despite retrieving potentially related content, the evidence "
            f"does not sufficiently support this claim. The confidence "
            f"score is {confidence}."
        )
    return (
        "No supporting evidence was found in the uploaded documents for "
        f"this claim. The confidence score is {confidence}."
    )


# ---------------------------------------------------------------------------
# Graph Construction — builds the LangGraph StateGraph
# ---------------------------------------------------------------------------

def build_validation_graph():
    """Build and compile the LangGraph StateGraph.

    Returns a compiled graph with strict sequential execution:
        START → planner → claim_extractor → [retriever → verifier → explainer] → END

    All nodes are pure functions. No classes. No wrappers.
    """
    graph = StateGraph(PipelineState)

    # Register pure-function nodes
    graph.add_node("planner", planner_node)
    graph.add_node("claim_extractor", claim_extractor_node)
    graph.add_node("retriever", retriever_node)
    graph.add_node("verifier", verifier_node)
    graph.add_node("explainer", explainer_node)

    # Strict sequential edges (NON-NEGOTIABLE order)
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "claim_extractor")
    graph.add_conditional_edges(
        "claim_extractor",
        check_claims_extracted,
        {"has_claims": "retriever", "no_claims": END},
    )
    graph.add_edge("retriever", "verifier")
    graph.add_edge("verifier", "explainer")
    graph.add_edge("explainer", END)

    return graph.compile()


# ---------------------------------------------------------------------------
# Public API — used by the backend to execute the pipeline
# ---------------------------------------------------------------------------

class ValidationPipeline:
    """Thin entry point that holds runtime dependencies and invokes the graph.

    This is NOT an agent class. It only:
    1. Stores references to vector_store and llm_client
    2. Injects them into shared state
    3. Calls graph.invoke()

    All reasoning logic lives in the graph nodes above.
    """

    def __init__(self, vector_store, llm_client=None):
        self.vector_store = vector_store
        self.llm_client = llm_client
        self.graph = build_validation_graph()

    def execute(self, raw_input: str) -> dict:
        """Execute the LangGraph validation pipeline.

        Args:
            raw_input: User's input text.

        Returns:
            Dict with input_type and structured claim results.

        Raises:
            ValueError: If input is invalid.
            RuntimeError: If a pipeline stage fails.
        """
        if not raw_input or not raw_input.strip():
            raise ValueError("Input text is empty.")

        initial_state: PipelineState = {
            "_vector_store": self.vector_store,
            "_llm_client": self.llm_client,
            "raw_input": raw_input,
            "input_type": "",
            "pipeline_decision": "",
            "claims": [],
            "evidence_map": {},
            "verification_results": [],
            "final_results": [],
            "error": None,
        }

        final_state = self.graph.invoke(initial_state)

        claims = final_state.get("final_results", [])
        if not claims:
            return {
                "input_type": final_state.get("input_type", "answer"),
                "claims": [],
                "message": "No factual claims could be extracted from the input.",
            }

        return {
            "input_type": final_state.get("input_type", "answer"),
            "claims": claims,
        }

