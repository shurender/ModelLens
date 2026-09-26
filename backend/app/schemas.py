from pydantic import BaseModel, Field, field_validator
from typing import List, Literal, Optional

class QueryRequest(BaseModel):
    document_id: str = Field(min_length=1)
    question: str = Field(min_length=1)

    @field_validator("question", "document_id", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field must not be blank or whitespace-only.")
        return stripped

class EvidenceItem(BaseModel):
    text: str
    page: int
    score: float

class QueryResponse(BaseModel):
    query_id: str
    answer: str
    status: Literal["SUPPORTED", "CONTRADICTED", "NOT_FOUND", "UNCERTAIN", "ERROR"]
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: List[EvidenceItem]
    explanation: str
    latency_ms: int
    diagnosis_source: Literal["DETERMINISTIC", "LLM_EVALUATOR", "FALLBACK"] = "LLM_EVALUATOR"