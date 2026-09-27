"""
ModelLens — Document Upload Route

POST /api/v1/documents   — upload any document (PDF, DOCX, TXT, MD, CSV, etc.), extract + chunk, store in memory.
GET  /api/v1/documents   — list all uploaded documents.
"""

from __future__ import annotations

import logging
from pathlib import Path
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from extraction.config import MAX_UPLOAD_SIZE_BYTES, TEMP_DIR
from extraction.schemas import DocumentUploadResponse, ErrorResponse, StoredDocument
from extraction.services.document_service import extract_and_chunk

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

# ── In-Memory Document Store ────────────────────────────────────────────────
# Shared across the app so the query route can look up docs:
#   from extraction.routes.documents import documents
documents: dict[str, StoredDocument] = {}


@router.post(
    "",
    response_model=DocumentUploadResponse,
    responses={400: {"model": ErrorResponse}, 413: {"model": ErrorResponse}},
    summary="Upload a document",
)
async def upload_document(file: UploadFile = File(...)):
    """
    Accept any document upload (PDF, Word, Text, Markdown, CSV, JSON, code, etc.),
    extract text, chunk it, and store in memory.

    Returns the document_id that frontend / query route will use.
    """

    filename = file.filename or "uploaded_document.txt"

    # ── Read and validate size ───────────────────────────────────────────
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum upload size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Save to temp directory with proper extension ─────────────────────
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    suffix = Path(filename).suffix or ".txt"
    tmp_path = TEMP_DIR / f"{doc_id}{suffix}"

    try:
        tmp_path.write_bytes(content)
    except OSError as exc:
        logger.error("Failed to save temp file: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

    # ── Extract text and build chunks ────────────────────────────────────
    try:
        page_count, chunks = extract_and_chunk(tmp_path)
    except ValueError as exc:
        # Clean up the temp file on extraction failure
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        # Remove the temp file after extraction — data is now in memory
        tmp_path.unlink(missing_ok=True)

    # ── Store in memory ──────────────────────────────────────────────────
    stored = StoredDocument(
        document_id=doc_id,
        filename=filename,
        pages=page_count,
        chunks=chunks,
    )
    documents[doc_id] = stored

    logger.info(
        "Document uploaded: id=%s, filename=%s, pages=%d, chunks=%d",
        doc_id,
        filename,
        page_count,
        len(chunks),
    )

    return DocumentUploadResponse(
        document_id=doc_id,
        filename=filename,
        pages=page_count,
        status="ready",
    )


@router.get(
    "",
    response_model=list[DocumentUploadResponse],
    summary="List uploaded documents",
)
async def list_documents():
    """Return metadata for all documents currently stored in memory."""
    return [
        DocumentUploadResponse(
            document_id=doc.document_id,
            filename=doc.filename,
            pages=doc.pages,
            status="ready",
        )
        for doc in documents.values()
    ]


@router.delete(
    "/{document_id}",
    summary="Delete a document",
)
async def delete_document(document_id: str):
    """Remove a document from in-memory storage."""
    if document_id in documents:
        del documents[document_id]
        logger.info("Deleted document: %s", document_id)
        return {"status": "deleted", "document_id": document_id}
    raise HTTPException(status_code=404, detail="Document not found.")
