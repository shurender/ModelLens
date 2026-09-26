import asyncio
import os
import sys

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app

def test_live_query_endpoint():
    print("==================================================")
    print("Testing Live Endpoint: POST /api/v1/query")
    print("==================================================")

    client = TestClient(app)

    # Test 1: Valid Document Query
    print("\n--- TEST 1: POST /api/v1/query with Valid Document ---")
    payload1 = {
        "document_id": "doc_refund_policy",
        "question": "How many days do I have to request a refund?"
    }
    resp1 = client.post("/api/v1/query", json=payload1)
    print(f"Status Code: {resp1.status_code}")
    assert resp1.status_code == 200, f"Expected 200 OK, got {resp1.status_code}"

    data1 = resp1.json()
    print(f"Query ID: {data1.get('query_id')}")
    print(f"Status: {data1.get('status')}")
    print(f"Confidence: {data1.get('confidence')}")
    print(f"Diagnosis Source: {data1.get('diagnosis_source')}")
    print(f"Answer: {data1.get('answer')[:120]}...")
    print(f"Explanation: {data1.get('explanation')}")
    print(f"Latency: {data1.get('latency_ms')} ms")
    print(f"Evidence Count: {len(data1.get('evidence', []))}")

    assert "query_id" in data1
    assert data1.get("status") in ["SUPPORTED", "CONTRADICTED", "NOT_FOUND", "UNCERTAIN", "ERROR"]
    assert 0.0 <= data1.get("confidence") <= 1.0
    assert len(data1.get("evidence")) > 0
    print("[SUCCESS] TEST 1 PASSED.")

    # Test 2: Unknown Document Query (Deterministic NOT_FOUND)
    print("\n--- TEST 2: POST /api/v1/query with Unknown Document ---")
    payload2 = {
        "document_id": "doc_nonexistent_999",
        "question": "What is the delivery timeline?"
    }
    resp2 = client.post("/api/v1/query", json=payload2)
    print(f"Status Code: {resp2.status_code}")
    assert resp2.status_code == 200

    data2 = resp2.json()
    print(f"Query ID: {data2.get('query_id')}")
    print(f"Status: {data2.get('status')}")
    print(f"Confidence: {data2.get('confidence')}")
    print(f"Diagnosis Source: {data2.get('diagnosis_source')}")
    print(f"Latency: {data2.get('latency_ms')} ms")

    assert data2.get("status") == "NOT_FOUND"
    assert data2.get("confidence") == 0.0
    assert data2.get("diagnosis_source") == "DETERMINISTIC"
    assert len(data2.get("evidence")) == 0
    print("[SUCCESS] TEST 2 PASSED.")

    print("\nALL ENDPOINT TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_live_query_endpoint()
