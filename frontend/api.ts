export type StatusType = 'SUPPORTED' | 'CONTRADICTED' | 'NOT_FOUND' | 'UNCERTAIN';
export type SeverityType = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export interface EvidenceItem {
  text: string;
  page: number;
  score: number;
}
export interface DiagnosisDetail {
  type: string;
  reason: string;
  severity: SeverityType;
}
export interface QueryResponse {
  query_id: string;
  document_id?: string;
  question?: string;
  answer: string;
  status: StatusType;
  confidence: number;
  evidence: EvidenceItem[];
  diagnosis: DiagnosisDetail;
  explanation: string;
  latency_ms: number;
}
export interface DocumentInfo {
  id: string;
  filename: string;
  pages: number;
  status: string;
  created_at: string;
}
export interface TraceItem {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  status: StatusType;
  confidence: number;
  diagnosis_type: string;
  diagnosis_reason: string;
  severity: SeverityType;
  explanation: string;
  latency_ms: number;
  evidence: EvidenceItem[];
  timestamp: string;
}
export interface DashboardMetrics {
  total_queries: number;
  total_failures: number;
  failure_rate: number;
  avg_evaluation_score: number;
  avg_latency_ms: number;
  failure_breakdown: Record<string, number>;
}
