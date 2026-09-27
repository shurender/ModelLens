"""
LLM Service - Groq Integration for ModelLens
=============================================
Handles grounded Q&A generation and answer evaluation via Groq's LLM API with:
- Strict prompt engineering (grounded prompting) to prevent hallucination
- Structured JSON evaluator output for diagnosis
- Fallback mechanism with exponential backoff for timeout/rate-limit errors
- Accurate latency measurement in milliseconds
- Structured logging for observability
"""

import httpx
import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logger = logging.getLogger("modellens.llm_service")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(handler)

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "openai/gpt-oss-120b")
DEFAULT_TIMEOUT_SECONDS = 30
MAX_RETRIES = 2
INITIAL_BACKOFF_SECONDS = 1.0
MAX_TOKENS = 1024
TEMPERATURE = 0.1  # Low temperature for factual, grounded answers

VALID_STATUSES = {"SUPPORTED", "CONTRADICTED", "NOT_FOUND", "UNCERTAIN"}


@dataclass
class LLMResult:
    answer: str
    explanation: str
    latency_ms: float
    model: str
    success: bool
    error_message: Optional[str] = None
    raw_usage: Optional[dict] = field(default_factory=dict)


@dataclass
class EvaluationResult:
    status: str          # SUPPORTED | CONTRADICTED | NOT_FOUND | UNCERTAIN
    confidence: float    # 0.0 - 1.0
    explanation: str     # Evidence-based reasoning
    latency_ms: float
    model: str
    success: bool
    error_message: Optional[str] = None
    raw_usage: Optional[dict] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Grounded Prompt Engineering — Answer Generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a precise, factual answering assistant for ModelLens — an AI analysis platform.

## STRICT RULES (NEVER VIOLATE):
1. Answer the user's question ONLY using the EVIDENCE provided below.
2. If the evidence does NOT contain enough information to answer, respond with EXACTLY:
   "INSUFFICIENT_EVIDENCE: The provided evidence does not contain enough information to answer this question."
3. NEVER fabricate, assume, or hallucinate information beyond what is explicitly stated in the evidence.
4. NEVER use your pre-trained knowledge to supplement the evidence.
5. Quote or closely paraphrase the evidence when possible.
6. If the evidence partially answers the question, answer only the part that is supported and explicitly state which part cannot be answered.

## RESPONSE FORMAT:
Provide your response in two clearly labeled sections:
**ANSWER:** [Your grounded answer here]
**EXPLANATION:** [Brief explanation of which evidence supports this answer and why]
"""


# ---------------------------------------------------------------------------
# Grounded Prompt Engineering — Evaluator (Structured JSON Output)
# ---------------------------------------------------------------------------

EVALUATOR_SYSTEM_PROMPT = """\
You are a strict, impartial factual evaluation engine for ModelLens — an AI document analysis platform.
Your sole task: determine whether the ANSWER is supported by the EVIDENCE. Nothing else.

## CLASSIFICATION DEFINITIONS (apply exactly as written):

SUPPORTED — use this ONLY when ALL of the following are true:
  * Every material factual claim in the ANSWER can be directly traced to a specific sentence or passage in the EVIDENCE.
  * The ANSWER does not extend, extrapolate, or add information beyond what the EVIDENCE explicitly states.
  * The ANSWER does not contradict any part of the EVIDENCE.
  -> Confidence range: 0.75 - 1.00

CONTRADICTED — use this when ANY of the following are true:
  * The ANSWER asserts a fact that is directly and explicitly negated or refuted by the EVIDENCE.
  * The ANSWER states a number, date, name, or categorical claim that conflicts with a different value stated in the EVIDENCE.
  * The ANSWER inverts or reverses a causal/conditional relationship stated in the EVIDENCE.
  -> Do NOT use CONTRADICTED for omissions or partial coverage — that is UNCERTAIN.
  -> Confidence range: 0.70 - 1.00

UNCERTAIN — use this when ANY of the following are true:
  * The EVIDENCE only partially covers the claims in the ANSWER (some claims supported, some not verifiable).
  * The EVIDENCE uses vague, hedged, or conditional language that makes the connection indirect.
  * The ANSWER makes an inference that is plausible given the EVIDENCE but not explicitly stated.
  * You can find relevant EVIDENCE but cannot confidently confirm the full ANSWER is grounded.
  -> Confidence range: 0.30 - 0.74

NOT_FOUND — use this ONLY when ALL of the following are true:
  * The EVIDENCE contains no information topically related to the question or the ANSWER.
  * No reasonable connection can be drawn between the EVIDENCE content and the ANSWER claims.
  -> Do NOT use NOT_FOUND if ANY relevant evidence exists — use UNCERTAIN instead.
  -> Confidence range: 0.00 - 0.29

## DECISION PROCEDURE (follow in order):
1. Read all EVIDENCE passages carefully.
2. For each factual claim in the ANSWER, ask: "Is this claim explicitly stated in the EVIDENCE?"
3. If any claim directly CONFLICTS with EVIDENCE -> CONTRADICTED.
4. If ALL claims are explicitly in EVIDENCE -> SUPPORTED.
5. If claims are partially covered or only inferable -> UNCERTAIN.
6. If EVIDENCE is entirely unrelated to the ANSWER -> NOT_FOUND.

## ABSOLUTE CONSTRAINTS:
- You MUST NOT use your pre-trained world knowledge. Base your verdict solely on the provided EVIDENCE text.
- You MUST NOT return SUPPORTED if the ANSWER contains ANY information not present in the EVIDENCE.
- You MUST NOT return CONTRADICTED for mere omissions — only for direct factual conflicts.
- Your explanation MUST quote or closely paraphrase the specific EVIDENCE passage(s) that drove your decision.
- If the ANSWER itself says "INSUFFICIENT_EVIDENCE" or equivalent, classify as NOT_FOUND with confidence 0.0.

## REQUIRED OUTPUT FORMAT:
Respond with ONLY a valid JSON object — no markdown fences, no prose, no leading/trailing text.
{
  "status": "SUPPORTED" | "CONTRADICTED" | "NOT_FOUND" | "UNCERTAIN",
  "confidence": <float between 0.0 and 1.0>,
  "explanation": "<cite the specific evidence passage(s) and explain exactly why this classification was chosen>"
}
"""


def _build_evaluator_prompt(
    question: str,
    answer: str,
    evidence_texts: List[str],
) -> str:
    """
    Constructs the user prompt for the evaluator LLM.

    Presents the evidence, the original question, and the generated answer
    so the evaluator can assess groundedness.
    """
    if not evidence_texts:
        evidence_block = "(No evidence provided)"
    else:
        evidence_lines = []
        for idx, text in enumerate(evidence_texts, start=1):
            evidence_lines.append(f"[Evidence {idx}]: {text.strip()}")
        evidence_block = "\n".join(evidence_lines)

    return f"""\
## PROVIDED EVIDENCE:
{evidence_block}

## ORIGINAL QUESTION:
{question}

## ANSWER TO EVALUATE:
{answer}

Evaluate the answer against the evidence and respond with ONLY a JSON object."""


def _build_user_prompt(question: str, evidence_texts: List[str]) -> str:
    """
    Constructs the user prompt with evidence context and the question.

    The evidence is formatted as numbered excerpts so the LLM can reference
    specific pieces when explaining its answer.
    """
    if not evidence_texts:
        evidence_block = "(No evidence provided)"
    else:
        evidence_lines = []
        for idx, text in enumerate(evidence_texts, start=1):
            evidence_lines.append(f"[Evidence {idx}]: {text.strip()}")
        evidence_block = "\n".join(evidence_lines)

    return f"""\
## PROVIDED EVIDENCE:
{evidence_block}

## USER QUESTION:
{question}

Remember: Answer ONLY based on the evidence above. Do not use external knowledge."""


# ---------------------------------------------------------------------------
# JSON Parsing Utilities
# ---------------------------------------------------------------------------

def _extract_json_from_text(raw_text: str) -> Optional[dict]:
    """
    Robustly extract a JSON object from LLM output.

    Handles common LLM quirks:
    - JSON wrapped in ```json ... ``` code fences
    - JSON with leading/trailing text
    - JSON with trailing commas (basic cleanup)
    """
    text = raw_text.strip()

    # 1. Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Try extracting from markdown code fence
    fence_pattern = r"```(?:json)?\s*\n?(.*?)\n?\s*```"
    fence_match = re.search(fence_pattern, text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 3. Try finding a JSON object by matching braces
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        candidate = text[brace_start : brace_end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # 4. Try removing trailing commas before closing braces
            cleaned = re.sub(r",\s*}", "}", candidate)
            cleaned = re.sub(r",\s*]", "]", cleaned)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass

    return None


def _validate_evaluation_json(data: dict) -> tuple[str, float, str]:
    """
    Validate and normalize the parsed evaluator JSON output.

    Returns (status, confidence, explanation) with safe defaults if fields
    are missing or malformed.
    """
    # Validate status
    raw_status = str(data.get("status", "UNCERTAIN")).upper().strip()
    status = raw_status if raw_status in VALID_STATUSES else "UNCERTAIN"

    # Validate confidence — log warning on type coercion failure
    raw_confidence = data.get("confidence", 0.5)
    try:
        confidence = float(raw_confidence)
        confidence = max(0.0, min(1.0, confidence))  # Clamp to [0.0, 1.0]
        confidence = round(confidence, 2)
    except (ValueError, TypeError):
        logger.warning(
            "Evaluator returned non-numeric confidence value: %r — defaulting to 0.5",
            raw_confidence,
        )
        confidence = 0.5

    # Validate explanation
    explanation = str(data.get("explanation", "No explanation provided by evaluator.")).strip()
    if not explanation:
        explanation = "No explanation provided by evaluator."

    return status, confidence, explanation


# ---------------------------------------------------------------------------
# Response Parsing — Answer Generation
# ---------------------------------------------------------------------------

def _parse_llm_response(raw_text: str) -> tuple[str, str]:
    """
    Parse the LLM's raw text output into (answer, explanation).

    Handles both structured (**ANSWER:** / **EXPLANATION:**) and
    unstructured responses gracefully.
    """
    answer = ""
    explanation = ""

    # Use regex search to avoid marker-collision bugs from find() on raw_upper
    answer_pattern = re.compile(
        r"\*{0,2}ANSWER:\*{0,2}\s*(.*?)(?=\*{0,2}EXPLANATION:\*{0,2}|$)",
        re.IGNORECASE | re.DOTALL,
    )
    explanation_pattern = re.compile(
        r"\*{0,2}EXPLANATION:\*{0,2}\s*(.*?)$",
        re.IGNORECASE | re.DOTALL,
    )

    answer_match = answer_pattern.search(raw_text)
    explanation_match = explanation_pattern.search(raw_text)

    if answer_match:
        answer = answer_match.group(1).strip()
        explanation = explanation_match.group(1).strip() if explanation_match else "No structured explanation provided by the model."
    else:
        # Fallback: treat entire response as the answer
        answer = raw_text.strip()
        explanation = "Response was not in the expected structured format."

    return answer, explanation


# ---------------------------------------------------------------------------
# Retry Logic with Exponential Backoff
# ---------------------------------------------------------------------------

# HTTP status codes that warrant a retry
_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


async def _call_groq_api(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    response_format: Optional[dict] = None,
) -> dict:
    """
    Makes an HTTP POST to the Groq chat completions API with retry logic.

    Retries up to MAX_RETRIES times on:
    - httpx.TimeoutException
    - httpx.ConnectError
    - HTTP 408, 429, 500, 502, 503, 504

    Uses exponential backoff between retries.

    Args:
        messages: Chat messages for the completion.
        model: Model identifier.
        timeout: Request timeout in seconds.
        response_format: Optional response format hint (e.g. {"type": "json_object"}).

    Returns:
        dict with keys: 'success', 'data' or 'error', 'status_code'
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set in environment variables")
        return {
            "success": False,
            "error": "GROQ_API_KEY is not configured. Please set it in .env file.",
            "status_code": None,
        }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "top_p": 1,
        "stream": False,
    }

    if response_format:
        payload["response_format"] = response_format

    last_error = None
    last_status_code = None

    for attempt in range(1, MAX_RETRIES + 2):  # +2 because range is exclusive and we have initial + retries
        try:
            logger.info(
                "Groq API call attempt %d/%d | model=%s | timeout=%.1fs",
                attempt,
                MAX_RETRIES + 1,
                model,
                timeout,
            )

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    GROQ_API_URL,
                    headers=headers,
                    json=payload,
                )

            last_status_code = response.status_code

            if response.status_code == 200:
                data = response.json()
                logger.info(
                    "Groq API success | attempt=%d | model=%s | usage=%s",
                    attempt,
                    model,
                    data.get("usage", {}),
                )
                return {"success": True, "data": data, "status_code": 200}

            # Check if status code is retryable
            if response.status_code in _RETRYABLE_STATUS_CODES and attempt <= MAX_RETRIES:
                backoff = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
                error_body = response.text[:300]
                logger.warning(
                    "Groq API returned %d (retryable) | attempt=%d | backoff=%.1fs | body=%s",
                    response.status_code,
                    attempt,
                    backoff,
                    error_body,
                )
                last_error = f"HTTP {response.status_code}: {error_body}"
                await _async_sleep(backoff)
                continue

            # Non-retryable HTTP error
            error_body = response.text[:500]
            logger.error(
                "Groq API non-retryable error | status=%d | body=%s",
                response.status_code,
                error_body,
            )
            return {
                "success": False,
                "error": f"Groq API error (HTTP {response.status_code}): {error_body}",
                "status_code": response.status_code,
            }

        except httpx.TimeoutException as exc:
            backoff = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
            last_error = f"Request timeout after {timeout}s: {str(exc)}"
            logger.warning(
                "Groq API timeout | attempt=%d/%d | backoff=%.1fs | error=%s",
                attempt,
                MAX_RETRIES + 1,
                backoff,
                str(exc),
            )
            if attempt <= MAX_RETRIES:
                await _async_sleep(backoff)
                continue

        except httpx.ConnectError as exc:
            backoff = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
            last_error = f"Connection error: {str(exc)}"
            logger.warning(
                "Groq API connection error | attempt=%d/%d | backoff=%.1fs | error=%s",
                attempt,
                MAX_RETRIES + 1,
                backoff,
                str(exc),
            )
            if attempt <= MAX_RETRIES:
                await _async_sleep(backoff)
                continue

        except Exception as exc:
            # Catch-all for unexpected errors — don't retry
            last_error = f"Unexpected error: {type(exc).__name__}: {str(exc)}"
            logger.exception("Groq API unexpected error | attempt=%d", attempt)
            return {
                "success": False,
                "error": last_error,
                "status_code": None,
            }

    # All retries exhausted
    logger.error(
        "Groq API all retries exhausted (%d attempts) | last_error=%s",
        MAX_RETRIES + 1,
        last_error,
    )
    return {
        "success": False,
        "error": f"All {MAX_RETRIES + 1} attempts failed. Last error: {last_error}",
        "status_code": last_status_code,
    }


async def _async_sleep(seconds: float) -> None:
    """Async sleep wrapper using asyncio for non-blocking backoff."""
    import asyncio
    await asyncio.sleep(seconds)


# ---------------------------------------------------------------------------
# Public API — Answer Generation
# ---------------------------------------------------------------------------

async def generate_grounded_answer(
    question: str,
    evidence_texts: List[str],
    model: str = DEFAULT_MODEL,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> LLMResult:
    """
    Generate a grounded answer to a question based on provided evidence.

    This is the main entry point of the LLM service. It:
    1. Constructs a grounded prompt with strict system instructions
    2. Calls the Groq API with retry/fallback logic
    3. Parses the structured response
    4. Measures latency accurately via time.perf_counter()

    Args:
        question: The user's question to answer.
        evidence_texts: List of evidence text chunks from document retrieval.
        model: Groq model identifier.
        timeout: Request timeout in seconds.

    Returns:
        LLMResult with answer, explanation, latency_ms, and metadata.
    """
    logger.info(
        "generate_grounded_answer called | question_len=%d | evidence_count=%d | model=%s",
        len(question),
        len(evidence_texts),
        model,
    )

    # --- Start latency timer (high-resolution) ---
    start_time = time.perf_counter()

    # Build messages for the chat completion
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(question, evidence_texts)},
    ]

    # Call Groq API with retry logic
    api_result = await _call_groq_api(messages, model=model, timeout=timeout)

    # --- End latency timer ---
    end_time = time.perf_counter()
    latency_ms = round((end_time - start_time) * 1000, 2)

    if not api_result["success"]:
        logger.error(
            "LLM call failed | latency_ms=%.2f | error=%s",
            latency_ms,
            api_result["error"],
        )
        return LLMResult(
            answer="",
            explanation="",
            latency_ms=latency_ms,
            model=model,
            success=False,
            error_message=api_result["error"],
            raw_usage={},
        )

    # Extract the LLM's response text
    try:
        data = api_result["data"]
        raw_text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Failed to parse Groq API response structure: %s", str(exc))
        return LLMResult(
            answer="",
            explanation="",
            latency_ms=latency_ms,
            model=model,
            success=False,
            error_message=f"Malformed API response: {str(exc)}",
            raw_usage={},
        )

    # Parse the structured answer and explanation
    answer, explanation = _parse_llm_response(raw_text)

    logger.info(
        "LLM call success | latency_ms=%.2f | answer_len=%d | explanation_len=%d | "
        "prompt_tokens=%s | completion_tokens=%s | total_tokens=%s",
        latency_ms,
        len(answer),
        len(explanation),
        usage.get("prompt_tokens", "?"),
        usage.get("completion_tokens", "?"),
        usage.get("total_tokens", "?"),
    )

    return LLMResult(
        answer=answer,
        explanation=explanation,
        latency_ms=latency_ms,
        model=model,
        success=True,
        error_message=None,
        raw_usage=usage,
    )


# ---------------------------------------------------------------------------
# Public API — Answer Evaluation (Structured JSON Output)
# ---------------------------------------------------------------------------

async def evaluate_answer(
    question: str,
    answer: str,
    evidence_texts: List[str],
    model: str = DEFAULT_MODEL,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> EvaluationResult:
    """
    Evaluate whether a generated answer is grounded in the provided evidence.

    Uses a dedicated evaluator prompt that requests structured JSON output
    with status, confidence, and explanation fields.

    This is the second LLM call in the pipeline — it acts as a "judge"
    separate from the answer generator to avoid self-confirmation bias.

    Args:
        question: The original user question.
        answer: The generated answer to evaluate.
        evidence_texts: List of evidence text chunks.
        model: Groq model identifier.
        timeout: Request timeout in seconds.

    Returns:
        EvaluationResult with status, confidence, explanation, and latency.
    """
    logger.info(
        "evaluate_answer called | question_len=%d | answer_len=%d | evidence_count=%d | model=%s",
        len(question),
        len(answer),
        len(evidence_texts),
        model,
    )

    # --- Start latency timer ---
    start_time = time.perf_counter()

    # Build evaluator messages
    messages = [
        {"role": "system", "content": EVALUATOR_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": _build_evaluator_prompt(question, answer, evidence_texts),
        },
    ]

    # Try with JSON response format hint (some models support this)
    api_result = await _call_groq_api(
        messages,
        model=model,
        timeout=timeout,
        response_format={"type": "json_object"},
    )

    # If JSON mode fails (model doesn't support it), retry without it
    # Covers both 400 Bad Request and 422 Unprocessable Entity
    if not api_result["success"] and api_result.get("status_code") in {400, 422}:
        logger.warning(
            "JSON mode not supported by model (HTTP %s), retrying without response_format",
            api_result.get("status_code"),
        )
        api_result = await _call_groq_api(
            messages, model=model, timeout=timeout
        )

    # --- End latency timer ---
    end_time = time.perf_counter()
    latency_ms = round((end_time - start_time) * 1000, 2)

    if not api_result["success"]:
        logger.error(
            "Evaluator LLM call failed | latency_ms=%.2f | error=%s",
            latency_ms,
            api_result["error"],
        )
        return EvaluationResult(
            status="UNCERTAIN",
            confidence=0.0,
            explanation=f"Evaluator failed: {api_result['error']}",
            latency_ms=latency_ms,
            model=model,
            success=False,
            error_message=api_result["error"],
            raw_usage={},
        )

    # Extract raw text
    try:
        data = api_result["data"]
        raw_text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Failed to parse evaluator response structure: %s", str(exc))
        return EvaluationResult(
            status="UNCERTAIN",
            confidence=0.0,
            explanation=f"Malformed evaluator response: {str(exc)}",
            latency_ms=latency_ms,
            model=model,
            success=False,
            error_message=f"Malformed API response: {str(exc)}",
            raw_usage={},
        )

    # Parse the JSON response
    parsed = _extract_json_from_text(raw_text)

    if parsed is None:
        logger.warning(
            "Evaluator returned non-JSON response, using fallback parsing | raw=%s",
            raw_text[:300],
        )
        return EvaluationResult(
            status="UNCERTAIN",
            confidence=0.5,
            explanation=f"Evaluator response was not valid JSON. Raw: {raw_text[:200]}",
            latency_ms=latency_ms,
            model=model,
            success=True,  # API call succeeded, just parsing failed
            error_message="Evaluator output was not valid JSON",
            raw_usage=usage,
        )

    # Validate and normalize the parsed JSON
    status, confidence, explanation = _validate_evaluation_json(parsed)

    logger.info(
        "Evaluator success | latency_ms=%.2f | status=%s | confidence=%.2f | "
        "prompt_tokens=%s | completion_tokens=%s",
        latency_ms,
        status,
        confidence,
        usage.get("prompt_tokens", "?"),
        usage.get("completion_tokens", "?"),
    )

    return EvaluationResult(
        status=status,
        confidence=confidence,
        explanation=explanation,
        latency_ms=latency_ms,
        model=model,
        success=True,
        error_message=None,
        raw_usage=usage,
    )
