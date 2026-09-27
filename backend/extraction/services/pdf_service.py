"""
ModelLens — PDF & Document Extraction Service

Extracts text from uploaded PDF, Word, and text-based files,
splits the text into overlapping word-based chunks, and
returns structured Chunk objects with page numbers.
"""

from __future__ import annotations

# Re-export all functions from document_service for seamless backward compatibility
from extraction.services.document_service import (
    WORDS_PER_PAGE,
    build_chunks,
    extract_and_chunk,
    extract_text_by_page,
)

__all__ = [
    "WORDS_PER_PAGE",
    "extract_text_by_page",
    "build_chunks",
    "extract_and_chunk",
]
