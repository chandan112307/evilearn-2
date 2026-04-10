"""Cognitive Load Optimizer -- LangGraph-based hybrid intelligent system.

This system sits between reasoning output and the user. It controls HOW
explanations are presented by combining LLM-powered analysis with
deterministic control logic.

Architecture (LangGraph cyclic StateGraph, 6 nodes):
    START -> explanation_analyzer (LLM) -> user_state_tracker -> load_estimator
    -> control_engine -> granularity_controller (LLM)
    -> feedback_manager -> (conditional: loop back or END)

Hybrid design:
    - Nodes 1 & 5 use LLM for semantic analysis and rewriting
    - Nodes 2, 3, 4, 6 remain fully deterministic
    - Every LLM call has a deterministic fallback

All nodes are pure functions operating on shared CognitiveLoadState.
The graph is cyclic -- the feedback manager decides whether to
re-optimize or finalize.
"""

import os
import re
import json
import time
from typing import TypedDict

from langgraph.graph import StateGraph, START, END

from ..schemas import (
    ExplanationStep,
    UserCognitiveState,
    CognitiveLoadMetrics,
    ControlAction,
)
from ..logging_config import get_logger, log_execution_time


# ---------------------------------------------------------------------------
# Loggers
# ---------------------------------------------------------------------------

_log_analyzer = get_logger("cognitive_load.explanation_analyzer")
_log_tracker = get_logger("cognitive_load.user_state_tracker")
_log_estimator = get_logger("cognitive_load.load_estimator")
_log_control = get_logger("cognitive_load.control_engine")
_log_granularity = get_logger("cognitive_load.granularity_controller")
_log_feedback = get_logger("cognitive_load.feedback_manager")
_log_graph = get_logger("cognitive_load.graph")
_log_optimizer = get_logger("cognitive_load.optimizer")
_log_data = get_logger("cognitive_load.data_layer")


# ---------------------------------------------------------------------------
# Shared State
# ---------------------------------------------------------------------------

class CognitiveLoadState(TypedDict):
    """Shared state for the Cognitive Load Optimizer graph."""

    # Input
    raw_explanation: str
    user_id: str

    # Injected dependency
    _llm_client: object

    # Explanation analysis (written by explanation_analyzer)
    steps: list[dict]           # list of ExplanationStep dicts

    # User state (written by user_state_tracker)
    user_state: dict            # UserCognitiveState dict

    # Load metrics (written by load_estimator)
    load_metrics: dict          # CognitiveLoadMetrics dict

    # Control decisions (written by control_engine)
    load_state: str             # overload / optimal / underload
    reasoning_mode: str         # fine-grained / medium / coarse
    control_actions: list[dict] # list of ControlAction dicts

    # Restructured output (written by granularity_controller)
    adapted_steps: list[dict]   # list of ExplanationStep dicts

    # Feedback loop (written by feedback_manager)
    iteration: int
    max_iterations: int
    converged: bool


# ---------------------------------------------------------------------------
# LLM Helper
# ---------------------------------------------------------------------------

def _llm_call(llm_client: object, prompt: str, purpose: str,
              logger, max_tokens: int = 2048) -> str:
    """Make a single LLM call with full logging.

    Returns empty string on failure.
    """
    if not llm_client:
        logger.warning("No LLM client available — skipping LLM call")
        return ""

    model = os.environ.get("LLM_MODEL", "llama3-8b-8192")
    logger.llm(f"Model: {model}")
    logger.llm(f"Purpose: {purpose}")
    logger.llm(f"[LLM PROMPT]\n{prompt}")

    start = time.perf_counter()
    try:
        response = llm_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_completion_tokens=max_tokens,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.perf(f"LLM call completed in {elapsed_ms:.1f}ms")

        raw_text = response.choices[0].message.content or ""
        logger.llm(f"[LLM RESPONSE]\n{raw_text}")
        return raw_text.strip()

    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.error(f"LLM call failed after {elapsed_ms:.1f}ms: {e}")
        logger.llm("[LLM FALLBACK] triggered — LLM call raised exception")
        return ""


def _parse_json(text: str, logger, fallback=None):
    """Extract and parse JSON from LLM response text."""
    if not text:
        logger.debug("Empty text — returning fallback")
        return fallback
    for pattern in [r'\[.*\]', r'\{.*\}']:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group())
                logger.llm(f"[LLM PARSED] Successfully parsed JSON ({type(parsed).__name__})")
                return parsed
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"JSON parse attempt failed: {e}")
                continue
    logger.warning("No valid JSON found in LLM response — returning fallback")
    logger.llm("[LLM FALLBACK] triggered — JSON parsing failed")
    return fallback


# ---------------------------------------------------------------------------
# In-memory user state store (persistent across requests within process)
# ---------------------------------------------------------------------------

_user_states: dict[str, dict] = {}


def _get_user_state(user_id: str) -> dict:
    """Retrieve or initialize user cognitive state."""
    if user_id not in _user_states:
        state = UserCognitiveState(user_id=user_id)
        _user_states[user_id] = state.model_dump()
        _log_data.info(f"Initialized new user state for user_id={user_id}")
        _log_data.state(f"Cache miss: created default state for user_id={user_id}")
    else:
        _log_data.state(f"Cache hit: loaded existing state for user_id={user_id}")
    return _user_states[user_id].copy()


def _save_user_state(user_id: str, state: dict) -> None:
    """Persist updated user state."""
    _user_states[user_id] = state.copy()
    _log_data.state(f"Stored updated state for user_id={user_id}")
    _log_data.debug(f"State values: understanding={state.get('understanding_level')}, "
                    f"stability={state.get('reasoning_stability')}, "
                    f"speed={state.get('learning_speed')}")


# ---------------------------------------------------------------------------
# Node 1: Explanation Analyzer (LLM-POWERED with deterministic fallback)
# ---------------------------------------------------------------------------

@log_execution_time("cognitive_load.explanation_analyzer")
def explanation_analyzer_node(state: CognitiveLoadState) -> dict:
    """Decompose explanation into reasoning steps using LLM.

    Uses LLM to:
    - Decompose explanation into true reasoning steps (not sentence-based)
    - Extract concepts accurately
    - Assign abstraction levels (concrete / semi-abstract / abstract)
    - Maintain logical dependencies between steps

    Falls back to deterministic sentence splitting if LLM is unavailable.

    Reads: raw_explanation, _llm_client
    Writes: steps
    """
    _log_analyzer.flow("Enter Node: explanation_analyzer")

    raw = state["raw_explanation"]
    llm_client = state.get("_llm_client")

    _log_analyzer.state(f"Input: raw_explanation length={len(raw.split())} words")

    steps = []
    used_llm = False

    # --- LLM path ---
    if llm_client:
        _log_analyzer.info("Attempting LLM-based explanation analysis")

        prompt = (
            "You are an expert explanation analyzer. Decompose the following explanation "
            "into logical REASONING STEPS (not sentence splits). Each step should represent "
            "one coherent reasoning unit.\n\n"
            f"Explanation:\n{raw}\n\n"
            "Return a JSON array where each object has:\n"
            '- "step_id": string (e.g. "s1", "s2", ...)\n'
            '- "content": the reasoning step text\n'
            '- "concepts": array of key concepts used in this step\n'
            '- "abstraction_level": one of "concrete", "semi-abstract", "abstract"\n'
            '  (concrete = specific examples/numbers, semi-abstract = general rules, '
            'abstract = theoretical/formal)\n'
            '- "depends_on": array of step_ids this step depends on (empty for first step)\n\n'
            "Rules:\n"
            "- Group related sentences into single reasoning steps\n"
            "- Identify actual conceptual dependencies, not just sequential order\n"
            "- Extract meaningful domain concepts, not just capitalized words\n"
            "- Assign abstraction based on content meaning, not sentence length\n\n"
            "JSON array:"
        )

        raw_response = _llm_call(
            llm_client, prompt,
            purpose="Decompose explanation into semantic reasoning steps",
            logger=_log_analyzer,
        )
        parsed = _parse_json(raw_response, _log_analyzer, fallback=None)

        if isinstance(parsed, list) and len(parsed) > 0:
            _log_analyzer.debug(f"LLM returned {len(parsed)} steps")
            for i, item in enumerate(parsed):
                try:
                    step_id = item.get("step_id", f"s{i+1}")
                    abs_level = item.get("abstraction_level", "concrete")
                    if abs_level not in ("concrete", "semi-abstract", "abstract"):
                        abs_level = "concrete"

                    depends = item.get("depends_on", [])
                    if not isinstance(depends, list):
                        depends = []

                    step = ExplanationStep(
                        step_id=step_id,
                        content=item.get("content", ""),
                        concepts=item.get("concepts", []),
                        abstraction_level=abs_level,
                        depends_on=depends,
                    )
                    steps.append(step.model_dump())
                    _log_analyzer.debug(
                        f"  Step {step_id}: concepts={step.concepts}, "
                        f"abstraction={abs_level}, depends_on={depends}"
                    )
                except Exception as e:
                    _log_analyzer.warning(f"Failed to parse step {i}: {e}")

            if steps:
                used_llm = True
                _log_analyzer.llm("[LLM FALLBACK] not triggered — LLM analysis succeeded")

    # --- Deterministic fallback ---
    if not steps:
        if llm_client:
            _log_analyzer.warning("LLM analysis produced no valid steps — falling back to deterministic")
            _log_analyzer.llm("[LLM FALLBACK] triggered — falling back to deterministic sentence splitting")
        else:
            _log_analyzer.info("No LLM client — using deterministic sentence splitting")

        sentences = re.split(r'(?<=[.!?])\s+', raw.strip())
        for i, sent in enumerate(sentences):
            sent = sent.strip()
            if len(sent) < 5:
                continue

            word_count = len(sent.split())
            if word_count > 30:
                abs_level = "abstract"
            elif word_count > 15:
                abs_level = "semi-abstract"
            else:
                abs_level = "concrete"

            concepts = []
            for word in sent.split():
                cleaned = re.sub(r'[^a-zA-Z]', '', word)
                if cleaned and cleaned[0].isupper() and len(cleaned) > 2:
                    concepts.append(cleaned)

            step = ExplanationStep(
                step_id=f"s{len(steps)+1}",
                content=sent,
                concepts=concepts,
                abstraction_level=abs_level,
                depends_on=[f"s{len(steps)}"] if steps else [],
            )
            steps.append(step.model_dump())

        _log_analyzer.debug(f"Deterministic fallback produced {len(steps)} steps")

    _log_analyzer.state(f"Output: {len(steps)} steps created (llm_used={used_llm})")
    for s in steps:
        _log_analyzer.debug(
            f"  {s['step_id']} | words={len(s['content'].split())} | "
            f"abstraction={s['abstraction_level']} | concepts={s.get('concepts', [])}"
        )

    _log_analyzer.flow("Exit Node: explanation_analyzer")
    return {"steps": steps}


# ---------------------------------------------------------------------------
# Node 2: User State Tracker
# ---------------------------------------------------------------------------

@log_execution_time("cognitive_load.user_state_tracker")
def user_state_tracker_node(state: CognitiveLoadState) -> dict:
    """Load and return the current user cognitive state.

    Reads: user_id
    Writes: user_state
    """
    _log_tracker.flow("Enter Node: user_state_tracker")

    user_id = state.get("user_id", "default")
    _log_tracker.state(f"Input: user_id={user_id}")

    user_state = _get_user_state(user_id)

    _log_tracker.debug(f"understanding={user_state.get('understanding_level')}, "
                       f"stability={user_state.get('reasoning_stability')}, "
                       f"speed={user_state.get('learning_speed')}, "
                       f"overload_signals={user_state.get('overload_signals')}, "
                       f"interactions={user_state.get('interaction_count')}")
    _log_tracker.state(f"Output: user_state loaded for user_id={user_id}")
    _log_tracker.flow("Exit Node: user_state_tracker")

    return {"user_state": user_state}


# ---------------------------------------------------------------------------
# Node 3: Load Estimator (DETERMINISTIC — no LLM)
# ---------------------------------------------------------------------------

@log_execution_time("cognitive_load.load_estimator")
def load_estimator_node(state: CognitiveLoadState) -> dict:
    """Compute cognitive load from explanation structure.

    Three dimensions:
    - step_density: steps per 100 words of content
    - concept_gap: average new concepts introduced per step transition
    - memory_demand: max concurrent dependencies + concepts any step holds

    On loop iterations, uses adapted_steps instead of original steps.

    Reads: steps (or adapted_steps on loop iterations)
    Writes: load_metrics
    """
    _log_estimator.flow("Enter Node: load_estimator")

    iteration = state.get("iteration", 0)
    source = "adapted_steps" if (iteration > 0 and state.get("adapted_steps")) else "original_steps"
    if iteration > 0 and state.get("adapted_steps"):
        steps = state["adapted_steps"]
    else:
        steps = state.get("steps", [])

    _log_estimator.state(f"Input: iteration={iteration}, source={source}, step_count={len(steps)}")

    if not steps:
        metrics = CognitiveLoadMetrics().model_dump()
        _log_estimator.debug("No steps available — returning default metrics")
        _log_estimator.state(f"Output: load_metrics={metrics}")
        _log_estimator.flow("Exit Node: load_estimator")
        return {"load_metrics": metrics}

    # Step density: steps per 100 words
    total_words = sum(len(s.get("content", "").split()) for s in steps)
    step_density = (len(steps) / max(total_words, 1)) * 100
    _log_estimator.debug(f"step_density calculation: {len(steps)} steps / {total_words} words * 100 = {step_density:.2f}")

    # Concept gap: average new concepts between consecutive steps
    total_new = 0
    for i in range(1, len(steps)):
        prev = set(steps[i - 1].get("concepts", []))
        curr = set(steps[i].get("concepts", []))
        new_concepts = curr - prev
        total_new += len(new_concepts)
        if new_concepts:
            _log_estimator.debug(f"  Step {steps[i].get('step_id')}: new concepts = {new_concepts}")
    concept_gap = total_new / max(len(steps) - 1, 1) if len(steps) > 1 else 0
    _log_estimator.debug(f"concept_gap = {total_new} new / {max(len(steps)-1,1)} transitions = {concept_gap:.2f}")

    # Memory demand: max dependencies + concepts any single step holds
    memory_demand = 0.0
    for s in steps:
        load = len(s.get("depends_on", [])) + len(s.get("concepts", []))
        memory_demand = max(memory_demand, float(load))
    _log_estimator.debug(f"memory_demand = {memory_demand:.2f}")

    # Composite load (0-10 scale)
    total_load = min(
        (step_density * 2.0) + (concept_gap * 2.5) + (memory_demand * 1.5),
        10.0,
    )
    _log_estimator.debug(
        f"total_load = min(({step_density:.2f}*2.0) + ({concept_gap:.2f}*2.5) + "
        f"({memory_demand:.2f}*1.5), 10.0) = {total_load:.2f}"
    )

    metrics = CognitiveLoadMetrics(
        step_density=round(step_density, 2),
        concept_gap=round(concept_gap, 2),
        memory_demand=round(memory_demand, 2),
        total_load=round(total_load, 2),
    )

    _log_estimator.state(f"Output: total_load={total_load:.2f}, step_density={step_density:.2f}, "
                         f"concept_gap={concept_gap:.2f}, memory_demand={memory_demand:.2f}")
    _log_estimator.flow("Exit Node: load_estimator")

    return {"load_metrics": metrics.model_dump()}


# ---------------------------------------------------------------------------
# Node 4: Control Engine (DETERMINISTIC — no LLM)
# ---------------------------------------------------------------------------

@log_execution_time("cognitive_load.control_engine")
def control_engine_node(state: CognitiveLoadState) -> dict:
    """Compare load vs user capacity and decide adaptation strategy.

    User capacity = (understanding x 5) + (stability x 5) on 0-10 scale.
    Deterministic decisions only.

    Reads: load_metrics, user_state, steps (or adapted_steps)
    Writes: load_state, reasoning_mode, control_actions
    """
    _log_control.flow("Enter Node: control_engine")

    load_metrics = state.get("load_metrics", {})
    user_state = state.get("user_state", {})

    total_load = load_metrics.get("total_load", 5.0)
    understanding = user_state.get("understanding_level", 0.5)
    stability = user_state.get("reasoning_stability", 0.5)

    user_capacity = (understanding * 5.0) + (stability * 5.0)

    _log_control.state(f"Input: total_load={total_load:.2f}, understanding={understanding}, "
                       f"stability={stability}")
    _log_control.debug(f"total_load={total_load:.2f}, capacity={user_capacity:.2f}")
    _log_control.debug(f"Thresholds: overload>{user_capacity + 1.5:.2f}, "
                       f"underload<{user_capacity - 2.0:.2f}")

    control_actions = []

    if total_load > user_capacity + 1.5:
        # --- OVERLOAD ---
        load_state = "overload"
        reasoning_mode = "fine-grained"
        _log_control.info(f"Decision=overload (load={total_load:.2f} > capacity+1.5={user_capacity+1.5:.2f})")

        control_actions.append(ControlAction(
            action="split_steps",
            reason=f"Reducing complexity: splitting steps (load={total_load:.1f} > capacity={user_capacity:.1f})",
        ).model_dump())

        # Find which steps are overloaded
        iteration = state.get("iteration", 0)
        steps = state["adapted_steps"] if iteration > 0 and state.get("adapted_steps") else state.get("steps", [])
        for s in steps:
            word_count = len(s.get("content", "").split())
            if word_count > 25:
                sid = s.get("step_id", "?")
                control_actions.append(ControlAction(
                    action="overload_at_step",
                    reason=f"Overload detected at step {sid} ({word_count} words)",
                ).model_dump())
                _log_control.debug(f"Overload at step {sid}: {word_count} words")

        if load_metrics.get("concept_gap", 0) > 2.0:
            control_actions.append(ControlAction(
                action="add_intermediate",
                reason="Adding intermediate reasoning to bridge concept gaps",
            ).model_dump())
            _log_control.debug("Action: add_intermediate (concept_gap > 2.0)")

        if load_metrics.get("memory_demand", 0) > 4.0:
            control_actions.append(ControlAction(
                action="reduce_abstraction",
                reason="Reducing abstraction to lower memory demand",
            ).model_dump())
            _log_control.debug("Action: reduce_abstraction (memory_demand > 4.0)")

    elif total_load < user_capacity - 2.0:
        # --- UNDERLOAD ---
        load_state = "underload"
        reasoning_mode = "coarse"
        _log_control.info(f"Decision=underload (load={total_load:.2f} < capacity-2.0={user_capacity-2.0:.2f})")

        control_actions.append(ControlAction(
            action="merge_steps",
            reason=f"Increasing abstraction: skipping basics (load={total_load:.1f} < capacity={user_capacity:.1f})",
        ).model_dump())

        if load_metrics.get("step_density", 0) > 3.0:
            control_actions.append(ControlAction(
                action="increase_abstraction",
                reason="Compressing reasoning: raising abstraction level",
            ).model_dump())
            _log_control.debug("Action: increase_abstraction (step_density > 3.0)")

    else:
        # --- OPTIMAL ---
        load_state = "optimal"
        reasoning_mode = "medium"
        _log_control.info(f"Decision=optimal (load={total_load:.2f} within capacity range)")

        if total_load > user_capacity:
            control_actions.append(ControlAction(
                action="add_checkpoints",
                reason="Borderline load: adding checkpoints for safety",
            ).model_dump())
            _log_control.debug("Action: add_checkpoints (borderline)")
        else:
            control_actions.append(ControlAction(
                action="maintain",
                reason="Load matches capacity -- maintaining current structure",
            ).model_dump())
            _log_control.debug("Action: maintain")

    _log_control.debug(f"Total actions: {len(control_actions)}")
    for a in control_actions:
        _log_control.debug(f"  Action: {a['action']} — {a['reason']}")

    _log_control.state(f"Output: load_state={load_state}, reasoning_mode={reasoning_mode}, "
                       f"actions={[a['action'] for a in control_actions]}")
    _log_control.flow("Exit Node: control_engine")

    return {
        "load_state": load_state,
        "reasoning_mode": reasoning_mode,
        "control_actions": control_actions,
    }


# ---------------------------------------------------------------------------
# Node 5: Granularity Controller (LLM-POWERED with deterministic fallback)
# ---------------------------------------------------------------------------

@log_execution_time("cognitive_load.granularity_controller")
def granularity_controller_node(state: CognitiveLoadState) -> dict:
    """Adjust step size and abstraction based on control decisions.

    Uses LLM to:
    - Rewrite steps based on control_actions
    - Simplify when overload
    - Increase abstraction when underload
    - Add intermediate reasoning where required
    - Preserve meaning and correctness

    Falls back to deterministic restructuring if LLM is unavailable.

    Reads: steps (or adapted_steps on loop), load_state, control_actions, _llm_client
    Writes: adapted_steps
    """
    _log_granularity.flow("Enter Node: granularity_controller")

    iteration = state.get("iteration", 0)
    if iteration > 0 and state.get("adapted_steps"):
        steps = state["adapted_steps"]
    else:
        steps = state.get("steps", [])

    load_state = state.get("load_state", "optimal")
    actions = state.get("control_actions", [])
    action_types = {a.get("action", "") for a in actions}
    llm_client = state.get("_llm_client")

    _log_granularity.state(f"Input: load_state={load_state}, step_count={len(steps)}, "
                           f"actions={action_types}, iteration={iteration}")

    if not steps:
        _log_granularity.debug("No steps to adapt")
        _log_granularity.flow("Exit Node: granularity_controller")
        return {"adapted_steps": []}

    adapted = []
    used_llm = False

    # --- LLM path ---
    if llm_client and load_state != "optimal":
        _log_granularity.info(f"Attempting LLM-based step rewriting for load_state={load_state}")

        steps_json = json.dumps(steps, indent=2)
        actions_desc = "; ".join(
            f"{a.get('action', '')}: {a.get('reason', '')}" for a in actions
        )

        if load_state == "overload":
            instruction = (
                "The cognitive load is TOO HIGH. You must SIMPLIFY the explanation:\n"
                "- Split complex steps into smaller, simpler sub-steps\n"
                "- Use concrete language instead of abstract\n"
                "- Add intermediate reasoning steps to bridge concept gaps\n"
                "- Reduce the number of concepts per step\n"
                "- Each step should focus on ONE idea only\n"
                "- Preserve the original meaning and correctness"
            )
        else:  # underload
            instruction = (
                "The cognitive load is TOO LOW. You must INCREASE abstraction:\n"
                "- Merge simple steps into higher-level reasoning units\n"
                "- Use more abstract language where appropriate\n"
                "- Skip obvious intermediate steps\n"
                "- Combine related concepts into single steps\n"
                "- Preserve the original meaning and correctness"
            )

        prompt = (
            f"You are an expert explanation optimizer. Rewrite the following explanation steps "
            f"according to the instructions below.\n\n"
            f"Current steps:\n{steps_json}\n\n"
            f"Control actions: {actions_desc}\n\n"
            f"Instructions:\n{instruction}\n\n"
            f"Return a JSON array where each object has:\n"
            f'- "step_id": string (e.g. "s1", "s2", ...)\n'
            f'- "content": the rewritten step text\n'
            f'- "concepts": array of key concepts in this step\n'
            f'- "abstraction_level": one of "concrete", "semi-abstract", "abstract"\n'
            f'- "depends_on": array of step_ids this step depends on\n\n'
            f"JSON array:"
        )

        raw_response = _llm_call(
            llm_client, prompt,
            purpose=f"Rewrite explanation steps for {load_state} condition",
            logger=_log_granularity,
        )
        parsed = _parse_json(raw_response, _log_granularity, fallback=None)

        if isinstance(parsed, list) and len(parsed) > 0:
            _log_granularity.debug(f"LLM returned {len(parsed)} rewritten steps")
            for i, item in enumerate(parsed):
                try:
                    step_id = item.get("step_id", f"s{i+1}")
                    abs_level = item.get("abstraction_level", "concrete")
                    if abs_level not in ("concrete", "semi-abstract", "abstract"):
                        abs_level = "concrete"

                    depends = item.get("depends_on", [])
                    if not isinstance(depends, list):
                        depends = []

                    step = ExplanationStep(
                        step_id=step_id,
                        content=item.get("content", ""),
                        concepts=item.get("concepts", []),
                        abstraction_level=abs_level,
                        depends_on=depends,
                    )
                    adapted.append(step.model_dump())
                except Exception as e:
                    _log_granularity.warning(f"Failed to parse rewritten step {i}: {e}")

            if adapted:
                used_llm = True
                _log_granularity.llm("[LLM FALLBACK] not triggered — LLM rewriting succeeded")

    # --- Deterministic fallback ---
    if not adapted:
        if llm_client and load_state != "optimal":
            _log_granularity.warning("LLM rewriting produced no valid steps — falling back to deterministic")
            _log_granularity.llm("[LLM FALLBACK] triggered — falling back to deterministic restructuring")
        elif load_state == "optimal":
            _log_granularity.info("Load is optimal — using deterministic pass-through")
        else:
            _log_granularity.info("No LLM client — using deterministic restructuring")

        adapted = _deterministic_granularity(steps, load_state, action_types)

    # Clean dependency references
    valid_ids = {s.get("step_id", "") for s in adapted}
    for s in adapted:
        original_deps = s.get("depends_on", [])
        s["depends_on"] = [d for d in original_deps if d in valid_ids]
        if len(original_deps) != len(s["depends_on"]):
            _log_granularity.debug(
                f"  Cleaned deps for {s['step_id']}: {original_deps} -> {s['depends_on']}"
            )

    _log_granularity.state(f"Output: {len(adapted)} adapted steps (llm_used={used_llm})")
    for s in adapted:
        _log_granularity.debug(
            f"  {s['step_id']} | words={len(s['content'].split())} | "
            f"abstraction={s['abstraction_level']}"
        )

    _log_granularity.flow("Exit Node: granularity_controller")
    return {"adapted_steps": adapted}


def _deterministic_granularity(steps: list[dict], load_state: str,
                               action_types: set[str]) -> list[dict]:
    """Deterministic fallback for granularity control."""
    adapted = []

    if load_state == "overload":
        for s in steps:
            content = s.get("content", "")
            words = content.split()

            if len(words) > 25 and "split_steps" in action_types:
                mid = len(words) // 2
                split_idx = mid
                for j in range(mid, min(mid + 10, len(words))):
                    if j > 0 and words[j - 1].endswith(('.', '!', '?', ',', ';')):
                        split_idx = j
                        break

                part1 = " ".join(words[:split_idx])
                part2 = " ".join(words[split_idx:])
                concepts = s.get("concepts", [])
                sid = s["step_id"]

                adapted.append(ExplanationStep(
                    step_id=f"{sid}a",
                    content=part1,
                    concepts=concepts[: len(concepts) // 2 + 1],
                    abstraction_level="concrete",
                    depends_on=s.get("depends_on", []),
                ).model_dump())
                adapted.append(ExplanationStep(
                    step_id=f"{sid}b",
                    content=part2,
                    concepts=concepts[len(concepts) // 2 + 1 :],
                    abstraction_level="concrete",
                    depends_on=[f"{sid}a"],
                ).model_dump())
            else:
                abs_level = s.get("abstraction_level", "concrete")
                if abs_level != "concrete":
                    abs_map = {"abstract": "semi-abstract", "semi-abstract": "concrete"}
                    abs_level = abs_map.get(abs_level, abs_level)
                adapted.append(ExplanationStep(
                    step_id=s["step_id"],
                    content=content,
                    concepts=s.get("concepts", []),
                    abstraction_level=abs_level,
                    depends_on=s.get("depends_on", []),
                ).model_dump())

    elif load_state == "underload":
        abs_up = {"concrete": "semi-abstract", "semi-abstract": "abstract"}
        i = 0
        while i < len(steps):
            if (
                i + 1 < len(steps)
                and "merge_steps" in action_types
                and len(steps[i].get("content", "").split()) < 15
                and len(steps[i + 1].get("content", "").split()) < 15
            ):
                merged_content = (
                    steps[i].get("content", "") + " "
                    + steps[i + 1].get("content", "")
                )
                merged_concepts = list(set(
                    steps[i].get("concepts", [])
                    + steps[i + 1].get("concepts", [])
                ))
                base_abs = steps[i].get("abstraction_level", "concrete")
                new_abs = abs_up.get(base_abs, base_abs)

                adapted.append(ExplanationStep(
                    step_id=steps[i]["step_id"],
                    content=merged_content.strip(),
                    concepts=merged_concepts,
                    abstraction_level=new_abs,
                    depends_on=steps[i].get("depends_on", []),
                ).model_dump())
                i += 2
            else:
                s = steps[i]
                abs_level = s.get("abstraction_level", "concrete")
                if "increase_abstraction" in action_types:
                    abs_level = abs_up.get(abs_level, abs_level)
                adapted.append(ExplanationStep(
                    step_id=s["step_id"],
                    content=s.get("content", ""),
                    concepts=s.get("concepts", []),
                    abstraction_level=abs_level,
                    depends_on=s.get("depends_on", []),
                ).model_dump())
                i += 1

    else:
        # Optimal — keep structure, optionally add checkpoints
        for i, s in enumerate(steps):
            adapted.append(ExplanationStep(
                step_id=s["step_id"],
                content=s.get("content", ""),
                concepts=s.get("concepts", []),
                abstraction_level=s.get("abstraction_level", "concrete"),
                depends_on=s.get("depends_on", []),
            ).model_dump())
            if (
                "add_checkpoints" in action_types
                and (i + 1) % 3 == 0
                and i + 1 < len(steps)
            ):
                adapted.append(ExplanationStep(
                    step_id=f"checkpoint_{i + 1}",
                    content="[Checkpoint: Verify understanding of steps up to this point]",
                    concepts=[],
                    abstraction_level="concrete",
                    depends_on=[s["step_id"]],
                ).model_dump())

    return adapted


# ---------------------------------------------------------------------------
# Node 6: Feedback Manager (DETERMINISTIC — no LLM)
# ---------------------------------------------------------------------------

@log_execution_time("cognitive_load.feedback_manager")
def feedback_manager_node(state: CognitiveLoadState) -> dict:
    """Update user state and determine whether to loop.

    After adaptation:
    1. Update user state based on load outcome
    2. Decide if another iteration is needed
    3. Save user state for future interactions

    Reads: user_state, load_state, iteration, max_iterations
    Writes: user_state, iteration, converged
    """
    _log_feedback.flow("Enter Node: feedback_manager")

    user_state = state.get("user_state", {})
    load_state = state.get("load_state", "optimal")
    iteration = state.get("iteration", 0)
    max_iterations = state.get("max_iterations", 3)

    _log_feedback.state(f"Input: iteration={iteration}, load_state={load_state}, "
                        f"max_iterations={max_iterations}")

    interaction_count = user_state.get("interaction_count", 0) + 1
    understanding = user_state.get("understanding_level", 0.5)
    stability = user_state.get("reasoning_stability", 0.5)
    learning_speed = user_state.get("learning_speed", 0.5)
    overload_signals = user_state.get("overload_signals", 0)

    _log_feedback.debug(f"Before update: understanding={understanding:.3f}, "
                        f"stability={stability:.3f}, speed={learning_speed:.3f}, "
                        f"overload_signals={overload_signals}")

    if load_state == "overload":
        understanding = max(0.0, understanding - 0.05)
        stability = max(0.0, stability - 0.05)
        overload_signals += 1
        _log_feedback.debug("Applied overload adjustments: understanding-=0.05, stability-=0.05, overload_signals+=1")
    elif load_state == "underload":
        understanding = min(1.0, understanding + 0.05)
        stability = min(1.0, stability + 0.03)
        overload_signals = max(0, overload_signals - 1)
        _log_feedback.debug("Applied underload adjustments: understanding+=0.05, stability+=0.03, overload_signals-=1")
    else:
        stability = min(1.0, stability + 0.02)
        learning_speed = min(1.0, learning_speed + 0.02)
        _log_feedback.debug("Applied optimal adjustments: stability+=0.02, learning_speed+=0.02")

    updated = UserCognitiveState(
        user_id=user_state.get("user_id", "default"),
        understanding_level=round(understanding, 3),
        reasoning_stability=round(stability, 3),
        learning_speed=round(learning_speed, 3),
        overload_signals=overload_signals,
        interaction_count=interaction_count,
    )
    updated_dict = updated.model_dump()

    _save_user_state(updated_dict["user_id"], updated_dict)

    new_iteration = iteration + 1
    converged = (load_state == "optimal") or (new_iteration >= max_iterations)

    _log_feedback.debug(f"After update: understanding={understanding:.3f}, "
                        f"stability={stability:.3f}, speed={learning_speed:.3f}, "
                        f"overload_signals={overload_signals}")

    # --- Iteration / Loop logging ---
    _log_feedback.flow(f"Iteration {new_iteration}")
    _log_feedback.debug(f"load={state.get('load_metrics', {}).get('total_load', 0):.2f}")
    if converged:
        _log_feedback.info(f"Converged: load_state={load_state}, iterations={new_iteration}/{max_iterations}")
    else:
        _log_feedback.info(f"Continue loop: iteration {new_iteration}/{max_iterations}")

    _log_feedback.state(f"Output: iteration={new_iteration}, converged={converged}, "
                        f"user_state updated")
    _log_feedback.flow("Exit Node: feedback_manager")

    return {
        "user_state": updated_dict,
        "iteration": new_iteration,
        "converged": converged,
    }


# ---------------------------------------------------------------------------
# Conditional edge: loop or end
# ---------------------------------------------------------------------------

def _should_loop(state: CognitiveLoadState) -> str:
    decision = "end" if state.get("converged", True) else "loop"
    _log_graph.flow(f"Loop Decision -> {decision}")
    return decision

# ---------------------------------------------------------------------------
# Graph Construction
# ---------------------------------------------------------------------------

def build_cognitive_load_graph():
    """Build and compile the LangGraph StateGraph (6 nodes, cyclic).

    START -> explanation_analyzer -> user_state_tracker -> load_estimator
    -> control_engine -> granularity_controller
    -> feedback_manager -> (loop back to load_estimator OR END)
    """
    _log_graph.info("Building cognitive load graph")

    graph = StateGraph(CognitiveLoadState)

    graph.add_node("explanation_analyzer", explanation_analyzer_node)
    graph.add_node("user_state_tracker", user_state_tracker_node)
    graph.add_node("load_estimator", load_estimator_node)
    graph.add_node("control_engine", control_engine_node)
    graph.add_node("granularity_controller", granularity_controller_node)
    graph.add_node("feedback_manager", feedback_manager_node)

    graph.add_edge(START, "explanation_analyzer")
    graph.add_edge("explanation_analyzer", "user_state_tracker")
    graph.add_edge("user_state_tracker", "load_estimator")
    graph.add_edge("load_estimator", "control_engine")
    graph.add_edge("control_engine", "granularity_controller")
    graph.add_edge("granularity_controller", "feedback_manager")

    # Cyclic feedback: loop back to load_estimator or end
    graph.add_conditional_edges(
        "feedback_manager",
        _should_loop,
        {"loop": "load_estimator", "end": END},
    )

    compiled = graph.compile()
    _log_graph.info("Cognitive load graph compiled successfully")
    return compiled


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class CognitiveLoadOptimizer:
    """Entry point for cognitive load optimization.

    Holds the compiled LangGraph and invokes it.
    All logic lives in the graph nodes above.
    """

    def __init__(self, llm_client=None):
        self._llm_client = llm_client
        self.graph = build_cognitive_load_graph()
        _log_optimizer.info(f"CognitiveLoadOptimizer initialized (llm_client={'present' if llm_client else 'None'})")

    def optimize(self, explanation: str, user_id: str = "default") -> dict:
        """Optimize an explanation for cognitive load.

        Args:
            explanation: Raw explanation text.
            user_id: User identifier for state tracking.

        Returns:
            Dict with adapted_explanation, load_state, control_actions,
            user_state, load_metrics, reasoning_mode.
        """
        if not explanation or not explanation.strip():
            _log_optimizer.error("Empty explanation text provided")
            raise ValueError("Explanation text is empty.")

        _log_optimizer.flow("=== Cognitive Load Optimization START ===")
        _log_optimizer.state(f"Input: user_id={user_id}, explanation_length={len(explanation.split())} words")

        start_time = time.perf_counter()

        initial_state: CognitiveLoadState = {
            "raw_explanation": explanation,
            "user_id": user_id,
            "_llm_client": self._llm_client,
            "steps": [],
            "user_state": {},
            "load_metrics": {},
            "load_state": "optimal",
            "reasoning_mode": "medium",
            "control_actions": [],
            "adapted_steps": [],
            "iteration": 0,
            "max_iterations": 3,
            "converged": False,
        }

        final_state = self.graph.invoke(initial_state)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        _log_optimizer.perf(f"Total optimization completed in {elapsed_ms:.1f}ms")

        _log_optimizer.state(f"Output: load_state={final_state.get('load_state')}, "
                            f"reasoning_mode={final_state.get('reasoning_mode')}, "
                            f"iterations={final_state.get('iteration')}, "
                            f"adapted_steps={len(final_state.get('adapted_steps', []))}")
        _log_optimizer.flow("=== Cognitive Load Optimization END ===")

        return {
            "adapted_explanation": final_state.get("adapted_steps", []),
            "load_state": final_state.get("load_state", "optimal"),
            "control_actions": final_state.get("control_actions", []),
            "user_state": final_state.get("user_state", {}),
            "load_metrics": final_state.get("load_metrics", {}),
            "reasoning_mode": final_state.get("reasoning_mode", "medium"),
        }
