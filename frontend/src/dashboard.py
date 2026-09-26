from fastapi import APIRouter
from app.db.database import get_all_traces
from app.schemas.trace import DashboardMetrics
router = APIRouter(prefix="/api/v1", tags=["Dashboard Observability"])
@router.get("/dashboard/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics():
    traces = get_all_traces()
    total = len(traces)
    
    if total == 0:
        return DashboardMetrics(
            total_queries=0,
            total_failures=0,
            failure_rate=0.0,
            avg_evaluation_score=0.0,
            avg_latency_ms=0,
            failure_breakdown={
                "Generation Failure": 0,
                "Retrieval Failure": 0,
                "Context Ambiguity": 0,
                "Hallucination": 0
            }
        )
    failures = [t for t in traces if t["status"] != "SUPPORTED"]
    total_failures = len(failures)
    failure_rate = round(total_failures / total, 3)
    avg_conf = round(sum([t["confidence"] for t in traces]) / total, 2)
    avg_lat = int(sum([t["latency_ms"] for t in traces]) / total)
    breakdown = {
        "Generation Failure": 0,
        "Retrieval Failure": 0,
        "Context Ambiguity": 0,
        "Hallucination": 0
    }
    for f in failures:
        dtype = f["diagnosis_type"]
        if "Generation" in dtype:
            breakdown["Generation Failure"] += 1
        elif "Retrieval" in dtype:
            breakdown["Retrieval Failure"] += 1
        elif "Ambiguity" in dtype or "Partial" in dtype:
            breakdown["Context Ambiguity"] += 1
        else:
            breakdown["Hallucination"] += 1
    return DashboardMetrics(
        total_queries=total,
        total_failures=total_failures,
        failure_rate=failure_rate,
        avg_evaluation_score=avg_conf,
        avg_latency_ms=avg_lat,
        failure_breakdown=breakdown
    )
