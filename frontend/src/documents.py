from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid
from app.schemas.document import DocumentUploadResponse, DocumentInfo
from app.services.ingestion import extract_pdf_chunks
from app.db.database import save_document, save_chunks, get_all_documents
from typing import List
router = APIRouter(prefix="/api/v1", tags=["Documents"])
@router.post("/documents", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported.")
    
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    pages_count, chunks = extract_pdf_chunks(content)
    # Persist in SQLite
    save_document(doc_id, file.filename, pages_count, "ready")
    save_chunks(doc_id, chunks)
    return DocumentUploadResponse(
        document_id=doc_id,
        filename=file.filename,
        pages=pages_count,
        status="ready"
    )
@router.get("/documents", response_model=List[DocumentInfo])
def list_documents():
    docs = get_all_documents()
    return [
        DocumentInfo(
            id=d["id"],
            filename=d["filename"],
            pages=d["pages"],
            status=d["status"],
            created_at=d["created_at"]
        )
        for d in docs
    ]
