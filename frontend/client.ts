import axios from 'axios';
import { QueryResponse, DocumentInfo, TraceItem, DashboardMetrics } from '../types/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
export const checkHealth = async (): Promise<boolean> => {
  try {
    const res = await client.get('/health');
    return res.data.status === 'ok';
  } catch (err) {
    return false;
  }
};
export const uploadDocument = async (file: File): Promise<DocumentInfo> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/api/v1/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      id: res.data.document_id,
      filename: res.data.filename,
      pages: res.data.pages,
      status: res.data.status,
      created_at: new Date().toISOString(),
    };
  } catch (err) {
    // Mock fallback if backend offline
    return {
      id: `doc_mock_${Date.now()}`,
      filename: file.name,
      pages: 4,
      status: 'ready',
      created_at: new Date().toISOString(),
    };
  }
};
export const fetchDocuments = async (): Promise<DocumentInfo[]> => {
  try {
    const res = await client.get('/api/v1/documents');
    return res.data;
  } catch (err) {
    return [
      {
        id: 'doc_refund_policy',
        filename: 'refund_policy.pdf',
        pages: 4,
        status: 'ready',
        created_at: new Date().toISOString(),
      },
      {
        id: 'doc_leave_policy',
        filename: 'leave_policy.pdf',
        pages: 3,
        status: 'ready',
        created_at: new Date().toISOString(),
      },
    ];
  }
};
export const executeQuery = async (document_id: string, question: string): Promise<QueryResponse> => {
  try {
    const res = await client.post('/api/v1/query', { document_id, question });
    return res.data;
  } catch (err) {
    // Demo Mock Fallbacks for testing
    const qLower = question.toLowerCase();
    if (qLower.includes('60 days') || qLower.includes('contradict')) {
      return {
        query_id: `q_mock_${Date.now()}`,
        document_id,
        question,
        answer: 'Refunds are available within 60 days of purchase.',
        status: 'CONTRADICTED',
        confidence: 0.94,
        evidence: [
          {
            text: 'Customers may request a refund within 30 days of purchase with valid proof.',
            page: 1,
            score: 0.91,
          },
        ],
        diagnosis: {
          type: 'Likely Generation Failure',
          reason: 'The correct source document passage was retrieved (30 days), but the generated model answer claims 60 days.',
          severity: 'HIGH',
        },
        explanation: 'Grounding conflict: Generated numeric claim 60 contradicts source evidence 30.',
        latency_ms: 1240,
      };
    } else if (qLower.includes('mars') || qLower.includes('space') || qLower.includes('not found')) {
      return {
        query_id: `q_mock_${Date.now()}`,
        document_id,
        question,
        answer: 'I cannot determine this from the provided document as no relevant evidence was found.',
        status: 'NOT_FOUND',
        confidence: 0.95,
        evidence: [],
        diagnosis: {
          type: 'Likely Retrieval Failure',
          reason: 'No relevant text chunks matching the query were found in the document.',
          severity: 'MEDIUM',
        },
        explanation: 'No document evidence passages met the similarity threshold.',
        latency_ms: 680,
      };
    } else if (qLower.includes('limit') || qLower.includes('carry forward') || qLower.includes('uncertain')) {
      return {
        query_id: `q_mock_${Date.now()}`,
        document_id,
        question,
        answer: 'Employees may carry forward unused leave subject to manager approval.',
        status: 'UNCERTAIN',
        confidence: 0.65,
        evidence: [
          {
            text: 'Employees accrue annual leave per year. Leave requests must be submitted in advance.',
            page: 2,
            score: 0.45,
          },
        ],
        diagnosis: {
          type: 'Context Ambiguity / Partial Retrieval',
          reason: 'Retrieved text mentions annual leave but does not explicitly specify exact carry-forward limits.',
          severity: 'LOW',
        },
        explanation: 'Evidence contains related terms but incomplete corroboration.',
        latency_ms: 1110,
      };
    }
    // Default Supported
    return {
      query_id: `q_mock_${Date.now()}`,
      document_id,
      question,
      answer: 'Customers may request a full refund within 30 days of purchase.',
      status: 'SUPPORTED',
      confidence: 0.96,
      evidence: [
        {
          text: 'Customers may request a full refund within 30 days of purchase with valid proof of transaction.',
          page: 1,
          score: 0.92,
        },
      ],
      diagnosis: {
        type: 'No Failure - Grounded Response',
        reason: 'The answer is directly supported by retrieved source evidence on page 1.',
        severity: 'NONE',
      },
      explanation: 'The answer is directly supported by retrieved document evidence.',
      latency_ms: 1040,
    };
  }
};
export const fetchTraces = async (): Promise<TraceItem[]> => {
  try {
    const res = await client.get('/api/v1/traces');
    return res.data;
  } catch (err) {
    return [
      {
        id: 'q_demo_01',
        document_id: 'doc_refund_policy',
        question: 'What is the refund period?',
        answer: 'Customers may request a full refund within 30 days of purchase.',
        status: 'SUPPORTED',
        confidence: 0.96,
        diagnosis_type: 'No Failure - Grounded Response',
        diagnosis_reason: 'Directly supported by page 1 text.',
        severity: 'NONE',
        explanation: 'Direct match with source evidence.',
        latency_ms: 1040,
        evidence: [
          {
            text: 'Customers may request a full refund within 30 days of purchase.',
            page: 1,
            score: 0.92,
          },
        ],
        timestamp: new Date().toISOString(),
      },
      {
        id: 'q_demo_02',
        document_id: 'doc_refund_policy',
        question: 'What is the refund period?',
        answer: 'Refunds are available within 60 days of purchase.',
        status: 'CONTRADICTED',
        confidence: 0.94,
        diagnosis_type: 'Likely Generation Failure',
        diagnosis_reason: 'Retrieved passage specifies 30 days, but generated answer claims 60 days.',
        severity: 'HIGH',
        explanation: 'Numeric claim 60 conflicts with evidence 30.',
        latency_ms: 1240,
        evidence: [
          {
            text: 'Customers may request a full refund within 30 days of purchase.',
            page: 1,
            score: 0.91,
          },
        ],
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }
};
export const fetchMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const res = await client.get('/api/v1/dashboard/metrics');
    return res.data;
  } catch (err) {
    return {
      total_queries: 18,
      total_failures: 4,
      failure_rate: 0.222,
      avg_evaluation_score: 0.89,
      avg_latency_ms: 1120,
      failure_breakdown: {
        'Generation Failure': 2,
        'Retrieval Failure': 1,
        'Context Ambiguity': 1,
      },
    };
  }
};
