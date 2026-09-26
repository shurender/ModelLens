"""
Checker Service - Engine Evaluator & Diagnosis AI for ModelLens
================================================================
Orchestrates:
1. Grounded answer support evaluation (`check_answer_support`)
2. Structured Evaluator Output (Groq LLM Evaluator returning JSON)
3. Hybrid Decision support (Deterministic vs Semantic)
4. Graceful fallback when LLM API is unavailable
"""

import logging
import time
import uuid
from typing import List, Optional

from app.schemas import EvidenceItem, QueryResponse
from app.services.llm_service import (
    generate_grounded_answer,
    evaluate_answer,
    LLMResult,
    EvaluationResult,
)
from app.services.retrieval_service import retrieve_evidence

logger = logging.getLogger("modellens.checker_service")
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


_INSUFFICIENT_EVIDENCE_MARKER = "INSUFFICIENT_EVIDENCE"


def _fallback_status_and_confidence(
    llm_result: Optional[LLMResult],
    evidence_chunks: List[dict],
) -> tuple[str, float]:
    """
    Fallback deterministic status & confidence calculation when LLM Evaluator fails.
    """
    if llm_result and not llm_result.success:
        return "ERROR", 0.0

    if llm_result and _INSUFFICIENT_EVIDENCE_MARKER in llm_result.answer.upper():
        return "NOT_FOUND", 0.1

    if evidence_chunks:
        avg_evidence_score = sum(c.get("score", 0.0) for c in evidence_chunks) / len(evidence_chunks)
    else:
        avg_evidence_score = 0.0

    if avg_evidence_score >= 0.80:
        status = "SUPPORTED"
        confidence = round(min(avg_evidence_score * 1.0, 0.99), 2)
    elif avg_evidence_score >= 0.50:
        status = "UNCERTAIN"
        confidence = round(avg_evidence_score * 0.85, 2)
    else:
        status = "NOT_FOUND"
        confidence = round(avg_evidence_score * 0.5, 2)

    return status, confidence


async def check_answer_support(
    question: str,
    answer: str,
    evidence_chunks: List[dict],
    llm_result: Optional[LLMResult] = None,
) -> tuple[str, float, str, str]:
    """
    Check answer support against evidence using LLM Evaluator for structured output.

    Returns:
        tuple of (status, confidence, explanation, diagnosis_source)
        - status: SUPPORTED | CONTRADICTED | NOT_FOUND | UNCERTAIN | ERROR
        - confidence: float 0.0 - 1.0
        - explanation: evidence-based reasoning
        - diagnosis_source: DETERMINISTIC | LLM_EVALUATOR | FALLBACK
    """
    if not evidence_chunks:
        return (
            "NOT_FOUND",
            0.0,
            "Deterministic decision: No evidence chunks retrieved for document ID. LLM API call bypassed to save quota.",
            "DETERMINISTIC",
        )

    if _INSUFFICIENT_EVIDENCE_MARKER in answer.upper():
        explanation = (
            llm_result.explanation if llm_result and llm_result.explanation
            else "The provided evidence does not contain sufficient information to answer the question."
        )
        return ("NOT_FOUND", 0.0, explanation, "DETERMINISTIC")

    evidence_texts = [c["text"] for c in evidence_chunks if "text" in c]

    eval_result = await evaluate_answer(
        question=question,
        answer=answer,
        evidence_texts=evidence_texts,
    )

    if eval_result.success:
        return (
            eval_result.status,
            eval_result.confidence,
            eval_result.explanation,
            "LLM_EVALUATOR",
        )
    else:
        logger.warning(
            "LLM Evaluator failed, using fallback calculation | error=%s",
            eval_result.error_message,
        )
        status, confidence = _fallback_status_and_confidence(llm_result, evidence_chunks)
        fallback_exp = llm_result.explanation if llm_result and llm_result.explanation else "Fallback status determined based on evidence scores."
        return (status, confidence, fallback_exp, "FALLBACK")


async def check_and_answer(
    document_id: str,
    question: str,
) -> QueryResponse:
    """
    Convenience orchestrator function executing full live pipeline.
    """
    query_id = f"q_{uuid.uuid4().hex[:12]}"
    start_time = time.perf_counter()

    evidence_chunks = retrieve_evidence(document_id, question)

    if not evidence_chunks:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return QueryResponse(
            query_id=query_id,
            answer="INSUFFICIENT_EVIDENCE: No evidence available for the specified document.",
            status="NOT_FOUND",
            confidence=0.0,
            evidence=[],
            explanation="Deterministic decision: No evidence chunks retrieved for document ID. LLM API call bypassed to save quota.",
            latency_ms=elapsed_ms,
            diagnosis_source="DETERMINISTIC",
        )

    evidence_texts = [chunk["text"] for chunk in evidence_chunks]
    evidence_items = [
        EvidenceItem(
            text=chunk["text"],
            page=chunk["page"],
            score=chunk["score"],
        )
        for chunk in evidence_chunks
    ]

    llm_result = await generate_grounded_answer(
        question=question,
        evidence_texts=evidence_texts,
    )

    if not llm_result.success:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return QueryResponse(
            query_id=query_id,
            answer="Unable to generate an answer at this time.",
            status="ERROR",
            confidence=0.0,
            evidence=evidence_items,
            explanation=f"LLM service error: {llm_result.error_message}",
            latency_ms=elapsed_ms,
            diagnosis_source="FALLBACK",
        )

    status, confidence, explanation, diagnosis_source = await check_answer_support(
        question=question,
        answer=llm_result.answer,
        evidence_chunks=evidence_chunks,
        llm_result=llm_result,
    )

    total_latency_ms = int((time.perf_counter() - start_time) * 1000)

    return QueryResponse(
        query_id=query_id,
        answer=llm_result.answer,
        status=status,
        confidence=confidence,
        evidence=evidence_items,
        explanation=explanation,
        latency_ms=total_latency_ms,
        diagnosis_source=diagnosis_source,
    )
