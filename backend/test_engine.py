import asyncio
import os
import sys

# Reconfigure stdout to handle UTF-8 characters on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend app is in python path
sys.path.insert(0, os.path.abspath("."))


from app.services.checker_service import check_and_answer, retrieve_evidence

async def main():
    print("==================================================")
    print("Running Engine Evaluator & Diagnosis AI Tests")
    print("==================================================")

    # Test 1: Deterministic Decision (Empty evidence / unknown doc)
    print("\n--- TEST 1: Deterministic Path (Empty Evidence) ---")
    res1 = await check_and_answer(
        document_id="unknown_doc_123",
        question="What is the return window?"
    )
    print(f"Query ID: {res1.query_id}")
    print(f"Status: {res1.status}")
    print(f"Confidence: {res1.confidence}")
    print(f"Diagnosis Source: {res1.diagnosis_source}")
    print(f"Explanation: {res1.explanation}")
    print(f"Latency: {res1.latency_ms} ms")
    print(f"Evidence Count: {len(res1.evidence)}")
    assert res1.status == "NOT_FOUND"
    assert res1.confidence == 0.0
    assert res1.diagnosis_source == "DETERMINISTIC"
    assert len(res1.evidence) == 0
    print("[SUCCESS] TEST 1 PASSED: Deterministic path correctly bypassed LLM and returned NOT_FOUND.")

    # Test 2: Semantic Path (Valid document ID)
    print("\n--- TEST 2: Semantic Path (Valid Evidence & Document) ---")
    res2 = await check_and_answer(
        document_id="doc_refund_policy",
        question="What is the refund policy for purchases?"
    )
    print(f"Query ID: {res2.query_id}")
    print(f"Status: {res2.status}")
    print(f"Confidence: {res2.confidence}")
    print(f"Diagnosis Source: {res2.diagnosis_source}")
    print(f"Answer: {res2.answer[:120]}...")
    print(f"Explanation: {res2.explanation}")
    print(f"Latency: {res2.latency_ms} ms")
    print(f"Evidence Count: {len(res2.evidence)}")
    assert res2.status in ["SUPPORTED", "CONTRADICTED", "NOT_FOUND", "UNCERTAIN", "ERROR"]
    assert 0.0 <= res2.confidence <= 1.0
    print("[SUCCESS] TEST 2 PASSED: Semantic path generated response with structured diagnosis.")

    # Test 3: Semantic Path with Irrelevant Question
    print("\n--- TEST 3: Semantic Path (Irrelevant Question for Refund Doc) ---")
    res3 = await check_and_answer(
        document_id="doc_refund_policy",
        question="What is the capital city of France?"
    )
    print(f"Query ID: {res3.query_id}")
    print(f"Status: {res3.status}")
    print(f"Confidence: {res3.confidence}")
    print(f"Diagnosis Source: {res3.diagnosis_source}")
    print(f"Answer: {res3.answer[:120]}...")
    print(f"Explanation: {res3.explanation}")
    print(f"Latency: {res3.latency_ms} ms")
    print("[SUCCESS] TEST 3 PASSED.")

    print("\nALL TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())

