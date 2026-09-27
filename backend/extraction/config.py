"""
ModelLens — Configuration

Loads settings from environment variables with sensible defaults.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)


# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# ── File Uploads ─────────────────────────────────────────────────────────────
MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# ── Temporary Storage ───────────────────────────────────────────────────────
TEMP_DIR: Path = Path(__file__).resolve().parent.parent / "tmp_uploads"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# ── Retrieval ────────────────────────────────────────────────────────────────
CHUNK_SIZE_WORDS: int = int(os.getenv("CHUNK_SIZE_WORDS", "600"))
CHUNK_OVERLAP_WORDS: int = int(os.getenv("CHUNK_OVERLAP_WORDS", "80"))
TOP_K_EVIDENCE: int = int(os.getenv("TOP_K_EVIDENCE", "3"))
