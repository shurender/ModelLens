"""
ModelLens — Extraction Server Entry Point

Runs the extraction/retrieval endpoints.

To run standalone:
    cd backend
    python -m uvicorn extraction.server:app --reload --port 8000
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from extraction.config import ALLOWED_ORIGINS
from extraction.routes import documents, health

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ModelLens — Extraction API",
    description="Document upload (PDF, DOCX, TXT, MD, CSV, etc.), text extraction, chunking, and TF-IDF evidence retrieval.",
    version="0.1.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(documents.router)
