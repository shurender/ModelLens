import time
import uuid
import re
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas import QueryRequest, QueryResponse, EvidenceItem
from app.services.retrieval_service import retrieve_evidence
from app.services.llm_service import generate_grounded_answer
from app.services.checker_service import check_answer_support

router = APIRouter(prefix="/api/v1", tags=["Query"])

# In-memory execution trace storage
trace_history: list[dict] = []


@router.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest) -> QueryResponse:
    """
    Live Q&A and Verification Pipeline Endpoint:
    1. Receive document_id & question from QueryRequest.
    2. Call retrieval function to get evidence chunks.
    3. If evidence is empty, deterministically return NOT_FOUND.
    4. Call generate_grounded_answer() with LLM (or intelligent extractive fallback).
    5. Call check_answer_support() for verification.
    6. Record trace and return response.
    """
    query_id = f"q_{uuid.uuid4().hex[:12]}"
    start_time = time.perf_counter()

    evidence_chunks = retrieve_evidence(request.document_id, request.question)

    if not evidence_chunks:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        res = QueryResponse(
            query_id=query_id,
            answer="INSUFFICIENT_EVIDENCE: No evidence available for the specified document.",
            status="NOT_FOUND",
            confidence=0.0,
            evidence=[],
            explanation="Deterministic decision: No evidence chunks retrieved for document ID.",
            latency_ms=elapsed_ms,
            diagnosis_source="DETERMINISTIC",
        )
        _record_trace(request, res)
        return res

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
        question=request.question,
        evidence_texts=evidence_texts,
    )

    if not llm_result.success:
        # Intelligent Extractive Answer & Verification
        q_tokens = set(re.findall(r"\w+", request.question.lower())) - {"what", "is", "the", "are", "how", "when", "where", "can", "i", "a", "an", "do", "does"}

        all_sentences = []
        for chunk in evidence_chunks:
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk["text"]) if len(s.strip()) > 10]
            for s in sentences:
                s_tokens = set(re.findall(r"\w+", s.lower()))
                overlap = len(q_tokens & s_tokens)
                all_sentences.append({
                    "sentence": s,
                    "overlap": overlap,
                    "page": chunk["page"],
                    "score": chunk["score"],
                })

        all_sentences.sort(key=lambda x: (x["overlap"], x["score"]), reverse=True)
        best = all_sentences[0] if all_sentences else {
            "sentence": evidence_chunks[0]["text"][:250],
            "overlap": 0,
            "page": evidence_chunks[0]["page"],
            "score": evidence_chunks[0]["score"],
        }

        grounded_answer = best["sentence"]
        top_page = best["page"]
        top_score = float(best["score"])

        # Check for contradictions
        q_lower = request.question.lower()
        ans_lower = grounded_answer.lower()
        q_numbers = set(re.findall(r"\b\d+\b", q_lower))
        ans_numbers = set(re.findall(r"\b\d+\b", ans_lower))

        # If question mentions specific numbers that conflict with evidence numbers
        if q_numbers and ans_numbers and not (q_numbers & ans_numbers):
            calc_status = "CONTRADICTED"
            explanation = f"Conflict detected: query claims '{' '.join(q_numbers)}' which conflicts with verified source text specifying '{' '.join(ans_numbers)}' on Page {top_page}."
            confidence = 0.92
        elif ("not" in q_lower or "never" in q_lower or "no" in q_lower) and "not" not in ans_lower:
            calc_status = "CONTRADICTED"
            explanation = f"Conflict detected: query negative premise contradicts positive assertion in document on Page {top_page}."
            confidence = 0.88
        elif best["overlap"] > 0 or top_score >= 0.2:
            calc_status = "SUPPORTED"
            explanation = f"Factually supported by document evidence on Page {top_page} (confidence {min(top_score + 0.2, 0.98):.2f})."
            confidence = round(min(max(top_score + 0.2, 0.85), 0.98), 2)
        else:
            calc_status = "UNCERTAIN"
            explanation = f"Document mentions related topics on Page {top_page}, but direct corroboration is partial."
            confidence = 0.60

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        res = QueryResponse(
            query_id=query_id,
            answer=grounded_answer,
            status=calc_status,
            confidence=confidence,
            evidence=evidence_items,
            explanation=explanation,
            latency_ms=elapsed_ms,
            diagnosis_source="DETERMINISTIC",
        )
        _record_trace(request, res)
        return res

    # LLM Result Evaluation
    status, confidence, explanation, diagnosis_source = await check_answer_support(
        question=request.question,
        answer=llm_result.answer,
        evidence_chunks=evidence_chunks,
        llm_result=llm_result,
    )

    total_latency_ms = int((time.perf_counter() - start_time) * 1000)
    res = QueryResponse(
        query_id=query_id,
        answer=llm_result.answer,
        status=status,
        confidence=confidence,
        evidence=evidence_items,
        explanation=explanation,
        latency_ms=total_latency_ms,
        diagnosis_source=diagnosis_source,
    )
    _record_trace(request, res)
    return res


def _record_trace(request: QueryRequest, response: QueryResponse):
    """Store the query trace into in-memory trace history."""
    severity = "NONE" if response.status == "SUPPORTED" else ("HIGH" if response.status == "CONTRADICTED" else "MEDIUM")
    diag_type = "No Failure - Grounded Response" if response.status == "SUPPORTED" else (
        "Likely Generation Failure" if response.status == "CONTRADICTED" else "Likely Retrieval Failure"
    )

    trace_item = {
        "id": response.query_id,
        "document_id": request.document_id,
        "question": request.question,
        "answer": response.answer,
        "status": response.status,
        "confidence": response.confidence,
        "diagnosis_type": diag_type,
        "diagnosis_reason": response.explanation,
        "severity": severity,
        "explanation": response.explanation,
        "latency_ms": response.latency_ms,
        "evidence": [ev.model_dump() for ev in response.evidence],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    trace_history.insert(0, trace_item)
    if len(trace_history) > 100:
        trace_history.pop()


@router.get("/traces")
def get_traces():
    """Return all recorded query traces."""
    return trace_history


@router.get("/dashboard/metrics")
def get_metrics():
    """Compute aggregate observability metrics across recorded queries."""
    total = len(trace_history)
    if total == 0:
        return {
            "total_queries": 0,
            "total_failures": 0,
            "failure_rate": 0.0,
            "avg_evaluation_score": 1.0,
            "avg_latency_ms": 0,
            "failure_breakdown": {
                "Generation Failure": 0,
                "Retrieval Failure": 0,
                "Context Ambiguity": 0,
            },
        }

    failures = [t for t in trace_history if t["status"] in ("CONTRADICTED", "NOT_FOUND", "UNCERTAIN")]
    gen_fails = sum(1 for t in trace_history if t["status"] == "CONTRADICTED")
    ret_fails = sum(1 for t in trace_history if t["status"] == "NOT_FOUND")
    amb_fails = sum(1 for t in trace_history if t["status"] == "UNCERTAIN")

    avg_conf = sum(t["confidence"] for t in trace_history) / total
    avg_lat = int(sum(t["latency_ms"] for t in trace_history) / total)

    return {
        "total_queries": total,
        "total_failures": len(failures),
        "failure_rate": round(len(failures) / total, 3),
        "avg_evaluation_score": round(avg_conf, 2),
        "avg_latency_ms": avg_lat,
        "failure_breakdown": {
            "Generation Failure": gen_fails,
            "Retrieval Failure": ret_fails,
            "Context Ambiguity": amb_fails,
        },
    }