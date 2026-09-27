"""
ModelLens — Health Check Route

GET /health  →  {"status": "ok"}
"""

from fastapi import APIRouter

from extraction.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health():
    return HealthResponse(status="ok")
