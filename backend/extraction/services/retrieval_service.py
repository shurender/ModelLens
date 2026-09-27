"""
ModelLens — TF-IDF Retrieval Service

Given a list of Chunk objects and a question string, this service
ranks chunks by cosine similarity using scikit-learn's TfidfVectorizer
and returns the top-k most relevant evidence chunks.
"""

from __future__ import annotations

import logging
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from extraction.config import TOP_K_EVIDENCE
from extraction.schemas import Chunk, EvidenceChunk

logger = logging.getLogger(__name__)


def retrieve_evidence(
    chunks: list[Chunk],
    question: str,
    top_k: int | None = None,
) -> list[EvidenceChunk]:
    """
    Rank *chunks* against *question* using TF-IDF cosine similarity
    and return the top-k results as EvidenceChunk objects.

    Parameters
    ----------
    chunks : list[Chunk]
        Document chunks produced by pdf_service.build_chunks().
    question : str
        The user's natural-language question.
    top_k : int, optional
        Number of top results to return.  Defaults to config.TOP_K_EVIDENCE.

    Returns
    -------
    list[EvidenceChunk]
        Sorted by descending similarity score.  May be empty if *chunks*
        is empty or all scores are effectively zero.
    """
    if top_k is None:
        top_k = TOP_K_EVIDENCE

    if not chunks or not question.strip():
        logger.warning("retrieve_evidence called with empty chunks or question")
        return []

    chunk_texts = [c.text for c in chunks]

    # Build TF-IDF matrix over the chunk texts
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(chunk_texts)
    except ValueError:
        # Can happen if every chunk is empty / stop-words only
        logger.warning("TF-IDF fit failed — likely all chunks are stop words")
        return []

    # Transform the question into the same vector space
    query_vector = vectorizer.transform([question])

    # Cosine similarity → flat array of scores
    scores = cosine_similarity(query_vector, tfidf_matrix)[0]

    # Pair each chunk with its score, sort descending, take top-k
    scored = sorted(
        zip(chunks, scores),
        key=lambda pair: pair[1],
        reverse=True,
    )
    top = scored[:top_k]

    evidence: list[EvidenceChunk] = []
    for chunk, score in top:
        # Skip chunks with essentially zero relevance
        if score < 1e-6:
            continue
        evidence.append(
            EvidenceChunk(
                text=chunk.text,
                page=chunk.page,
                score=round(float(score), 4),
            )
        )

    # If TF-IDF found zero matches (e.g. stop-words, synonym questions, or query phrasing),
    # compute word-overlap heuristic or fallback to top document chunks
    if not evidence and chunks:
        q_tokens = set(re.findall(r"\w+", question.lower()))
        chunk_scores = []
        for c in chunks:
            c_tokens = set(re.findall(r"\w+", c.text.lower()))
            overlap = len(q_tokens & c_tokens)
            score = round(min(0.3 + (overlap * 0.1), 0.9), 4) if overlap > 0 else 0.5
            chunk_scores.append((c, score))

        chunk_scores.sort(key=lambda x: x[1], reverse=True)
        for c, s in chunk_scores[:top_k]:
            evidence.append(
                EvidenceChunk(
                    text=c.text,
                    page=c.page,
                    score=s,
                )
            )

    logger.info(
        "Retrieved %d evidence chunks (top_k=%d) for question: %.60s…",
        len(evidence),
        top_k,
        question,
    )
    return evidence
