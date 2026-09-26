import React, { useEffect, useState } from 'react';
import { TraceTable } from '../components/history/TraceTable';
import { fetchTraces } from '../api/client';
import { TraceItem, QueryResponse } from '../types/api';
interface HistoryPageProps {
  onSelectTrace: (trace: QueryResponse) => void;
}
export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectTrace }) => {
  const [traces, setTraces] = useState<TraceItem[]>([]);
  useEffect(() => {
    fetchTraces().then(setTraces);
  }, []);
  const handleSelectTrace = (traceId: string) => {
    const found = traces.find((t) => t.id === traceId);
    if (found) {
      const converted: QueryResponse = {
        query_id: found.id,
        document_id: found.document_id,
        question: found.question,
        answer: found.answer,
        status: found.status,
        confidence: found.confidence,
        evidence: found.evidence,
        diagnosis: {
          type: found.diagnosis_type,
          reason: found.diagnosis_reason,
          severity: found.severity,
        },
        explanation: found.explanation,
        latency_ms: found.latency_ms,
      };
      onSelectTrace(converted);
    }
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Trace History & Audit Logs</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Review past AI evaluation runs, filter by failure modes, and analyze pipeline performance</p>
      </div>
      <TraceTable traces={traces} onSelectTrace={handleSelectTrace} />
    </div>
  );
};
