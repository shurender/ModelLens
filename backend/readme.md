# 🛡️ ModelLens Backend — AI Groundedness & Diagnosis API

ModelLens is an enterprise-grade AI evaluation and Q&A engine designed for high-reliability RAG (Retrieval-Augmented Generation) applications. It guarantees strict factual groundedness, prevents AI hallucinations, and provides structured evaluation diagnoses.

---

## 🌟 Key Architecture & Features

### 1. Hybrid Decision Engine (Deterministic + Semantic Path)
- **Deterministic Bypassing**: If no relevant evidence is retrieved (`evidence_chunks` is empty), the engine immediately returns a `NOT_FOUND` status with `0.0` confidence and `diagnosis_source: DETERMINISTIC`. This **completely bypasses LLM API calls**, saving 100% token quota and delivering responses in ~1 ms.
- **Semantic LLM Evaluation Path**: When evidence exists, the engine runs a 2-stage LLM pipeline (Grounded Answer Generation + LLM Evaluator).

### 2. Strict Anti-Hallucination Grounded Prompting
- System prompts restrict answers strictly to the provided document evidence chunks.
- If evidence is insufficient, the LLM is instructed to explicitly flag `INSUFFICIENT_EVIDENCE`.

### 3. Structured JSON AI Diagnosis Output
- Evaluator returns clean JSON output with:
  - `status`: `SUPPORTED` | `CONTRADICTED` | `NOT_FOUND` | `UNCERTAIN` | `ERROR`
  - `confidence`: Precision float from `0.0` to `1.0`
  - `explanation`: Evidence-based rationale citing specific excerpts.
  - `diagnosis_source`: Tracks whether decision was `DETERMINISTIC`, `LLM_EVALUATOR`, or `FALLBACK`.

### 4. High Fault Tolerance & Retry Backoff
- Integrated exponential backoff handling for HTTP `429 (Rate Limit)` and `Timeout` errors.
- **Guaranteed No-500 Error Policy**: All unhandled exceptions fall back to a valid `QueryResponse` with status `ERROR` or `FALLBACK`.

---

## 🚀 Quick Start & Running Locally

### Prerequisites
- Python 3.10+
- Groq API Key (set in `.env`)

### Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DEFAULT_MODEL=openai/gpt-oss-120b
   ```

3. **Start FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **Access Interactive API Docs**:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Running Automated Tests

Run the test scripts to verify both the core engine and the live HTTP endpoints:

```bash
# Test Core Engine & Evaluator Logic
python test_engine.py

# Test Live FastAPI Route (POST /api/v1/query)
python test_query_route.py
```

---

## 📡 API Reference

### `POST /api/v1/query`

**Request Body**:
```json
{
  "document_id": "doc_refund_policy",
  "question": "What is the return policy window?"
}
```

**Response Body (`QueryResponse`)**:
```json
{
  "query_id": "q_f71dceeccefa",
  "answer": "Customers may request a full refund within 30 days of purchase...",
  "status": "SUPPORTED",
  "confidence": 0.99,
  "evidence": [
    {
      "text": "Customers may request a full refund within 30 days of purchase...",
      "page": 1,
      "score": 0.95
    }
  ],
  "explanation": "The answer matches Evidence 1, which states customers can request a full refund within 30 days.",
  "latency_ms": 4125,
  "diagnosis_source": "LLM_EVALUATOR"
}
```

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI Application Entry & CORS Setup
│   ├── schemas.py               # Pydantic Schemas (QueryRequest, QueryResponse)
│   ├── routes/
│   │   └── query.py             # Live Endpoint (POST /api/v1/query)
│   └── services/
│       ├── retrieval_service.py # Evidence Retrieval Service (Backend-Retrieval)
│       ├── llm_service.py       # Groq LLM API Integration & JSON Evaluator
│       └── checker_service.py   # Hybrid Decision Orchestrator & Diagnosis Engine
├── test_engine.py               # Test Suite for Engine Evaluator Logic
├── test_query_route.py          # Test Suite for Live Endpoint
└── README.md                    # Project Documentation
```
