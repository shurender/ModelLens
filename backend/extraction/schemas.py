"""
ModelLens — Pydantic Schemas

Schemas for document upload, evidence chunks,
and internal chunk representation.

Query schemas (QueryRequest, QueryResponse, SupportStatus) should be
defined in app/schemas.py, and can import EvidenceChunk from here.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Document Schemas ────────────────────────────────────────────────────────


class DocumentUploadResponse(BaseModel):
    """Response after a successful document upload (Section 8.1)."""

    document_id: str = Field(..., description="Unique identifier for the uploaded document")
    filename: str = Field(..., description="Original filename")
    pages: int = Field(..., description="Number of pages extracted")
    status: str = Field(default="ready", description="Processing status")


# ── Evidence / Retrieval Schemas ────────────────────────────────────────────


class EvidenceChunk(BaseModel):
    """A single piece of retrieved evidence (Section 8.3 → evidence[])."""

    text: str = Field(..., description="Chunk text")
    page: int = Field(..., description="Source page number (1-indexed)")
    score: float = Field(..., description="TF-IDF cosine similarity score")


# ── Internal Chunk Representation ───────────────────────────────────────────


class Chunk(BaseModel):
    """Internal representation of a document chunk used by retrieval."""

    chunk_id: str
    text: str
    page: int


# ── In-memory document store entry ─────────────────────────────────────────


class StoredDocument(BaseModel):
    """Metadata + chunks for a processed document kept in memory."""

    document_id: str
    filename: str
    pages: int
    chunks: list[Chunk] = Field(default_factory=list)


# ── Health ──────────────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    status: str = "ok"


# ── Error ───────────────────────────────────────────────────────────────────


class ErrorResponse(BaseModel):
    detail: str
