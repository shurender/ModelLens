import time
import uuid
from fastapi import APIRouter
from app.schemas import QueryRequest, QueryResponse, EvidenceItem
from app.services.retrieval_service import retrieve_evidence
from app.services.llm_service import generate_grounded_answer
from app.services.checker_service import check_answer_support

router = APIRouter(prefix="/api/v1", tags=["Query"])


@router.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest) -> QueryResponse:
    """
    Live Q&A and Verification Pipeline Endpoint:
    1. Receive document_id & question from QueryRequest.
    2. Call retrieval function (backend-retrieval) to get evidence chunks.
    3. Hybrid check: If evidence is empty, deterministically return NOT_FOUND (0 LLM API calls).
    4. Call generate_grounded_answer() from llm_service.py for grounded answer generation.
    5. Call check_answer_support() from checker_service.py for structured AI diagnosis.
    6. Return unified response matching QueryResponse Pydantic schema.
    """
    query_id = f"q_{uuid.uuid4().hex[:12]}"
    start_time = time.perf_counter()

    # Step 1 & 2: Receive request and retrieve evidence chunks from retrieval service
    evidence_chunks = retrieve_evidence(request.document_id, request.question)

    # Hybrid Decision: Deterministic path if no evidence found
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

    # Step 3: Call generate_grounded_answer() from llm_service.py
    llm_result = await generate_grounded_answer(
        question=request.question,
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

    # Step 4: Call check_answer_support() from checker_service.py
    status, confidence, explanation, diagnosis_source = await check_answer_support(
        question=request.question,
        answer=llm_result.answer,
        evidence_chunks=evidence_chunks,
        llm_result=llm_result,
    )

    total_latency_ms = int((time.perf_counter() - start_time) * 1000)

    # Step 5: Return unified response conforming to QueryResponse Pydantic schema
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