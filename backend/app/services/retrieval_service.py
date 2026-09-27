"""
Retrieval Service - Document Evidence Search (Backend-Retrieval)
===============================================================
Handles retrieving evidence chunks dynamically from user-uploaded documents only.
Does NOT store or read any hardcoded or mock documents in code.
"""

import logging
from typing import List

logger = logging.getLogger("modellens.retrieval_service")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(handler)


def retrieve_evidence(document_id: str, question: str, top_k: int = 3) -> List[dict]:
    """
    Retrieve relevant evidence chunks strictly from user-uploaded documents in memory.
    Returns an empty list if document_id does not exist or has no chunks.
    """
    try:
        from extraction.routes.documents import documents
        from extraction.services.retrieval_service import retrieve_evidence as tfidf_retrieve

        if document_id in documents:
            doc = documents[document_id]
            real_chunks = tfidf_retrieve(doc.chunks, question, top_k=top_k)
            result = [
                {"text": c.text, "page": c.page, "score": round(float(c.score), 4)}
                for c in real_chunks
            ]
            if not result and doc.chunks:
                result = [
                    {"text": c.text, "page": c.page, "score": 0.5}
                    for c in doc.chunks[:top_k]
                ]
            logger.info(
                "User document evidence retrieved | document_id=%s | chunks_found=%d",
                document_id,
                len(result),
            )
            return result
        else:
            logger.warning("Document ID not found in uploaded documents: %s", document_id)
            return []
    except Exception as exc:
        logger.error("Error retrieving evidence for document %s: %s", document_id, exc)
        return []


def get_evidence_chunks(document_id: str, question: str, top_k: int = 3) -> List[dict]:
    """Alias for retrieve_evidence."""
    return retrieve_evidence(document_id, question, top_k)
