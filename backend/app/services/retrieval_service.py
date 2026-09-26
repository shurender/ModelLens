"""
Retrieval Service - Document Evidence Search (Backend-Retrieval)
===============================================================
Handles retrieving evidence chunks from documents.
Currently uses mock vector store documents; ready for vector DB integration.
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


_MOCK_DOCUMENTS: dict[str, list[dict]] = {
    "doc_refund_policy": [
        {
            "text": "Customers may request a full refund within 30 days of purchase. "
                    "After 30 days, only partial refunds are available at the company's discretion.",
            "page": 1,
            "score": 0.95,
        },
        {
            "text": "Refund requests must be submitted through the customer portal or "
                    "by contacting support at support@example.com. Processing takes 5-7 business days.",
            "page": 2,
            "score": 0.88,
        },
        {
            "text": "Digital products and subscription services are non-refundable once activated, "
                    "unless the product is defective or does not match the description.",
            "page": 3,
            "score": 0.82,
        },
    ],
    "doc_privacy_policy": [
        {
            "text": "We collect personal data including name, email address, and usage analytics "
                    "to improve our services. Data is stored securely with AES-256 encryption.",
            "page": 1,
            "score": 0.93,
        },
        {
            "text": "Users can request data deletion at any time by contacting our privacy team. "
                    "We comply with GDPR and CCPA regulations.",
            "page": 4,
            "score": 0.90,
        },
    ],
    "doc_shipping": [
        {
            "text": "Standard shipping takes 5-7 business days within the continental US. "
                    "Express shipping (2-3 business days) is available for an additional fee of $12.99.",
            "page": 1,
            "score": 0.91,
        },
        {
            "text": "International shipping is available to over 50 countries. Delivery times "
                    "vary between 10-21 business days depending on the destination.",
            "page": 2,
            "score": 0.87,
        },
    ],
}


def retrieve_evidence(document_id: str, question: str, top_k: int = 3) -> List[dict]:
    """
    Retrieve relevant evidence chunks for a given document and question.

    Args:
        document_id: The document identifier.
        question: The query question.
        top_k: Max chunks to return.

    Returns:
        List of dicts with 'text', 'page', 'score' keys.
    """
    evidence = _MOCK_DOCUMENTS.get(document_id, [])
    if not evidence:
        logger.info(
            "Evidence retrieval empty | document_id=%s | question_len=%d",
            document_id,
            len(question),
        )
        return []

    sorted_evidence = sorted(evidence, key=lambda x: x["score"], reverse=True)
    result = sorted_evidence[:top_k]

    logger.info(
        "Evidence retrieved | document_id=%s | question_len=%d | chunks_found=%d | top_k=%d",
        document_id,
        len(question),
        len(result),
        top_k,
    )

    return result


def get_evidence_chunks(document_id: str, question: str, top_k: int = 3) -> List[dict]:
    """Alias for retrieve_evidence."""
    return retrieve_evidence(document_id, question, top_k)
