import axios from 'axios';
import { QueryResponse, DocumentInfo, TraceItem, DashboardMetrics } from '../types/api';

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post('/api/v1/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return {
    id: res.data.document_id || res.data.id,
    filename: res.data.filename,
    pages: res.data.pages,
    status: res.data.status,
    created_at: new Date().toISOString(),
  };
};

export const fetchDocuments = async (): Promise<DocumentInfo[]> => {
  try {
    const res = await client.get('/api/v1/documents');
    return (res.data || []).map((doc: any) => ({
      id: doc.document_id || doc.id,
      filename: doc.filename,
      pages: doc.pages,
      status: doc.status,
      created_at: doc.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    return [];
  }
};

export const deleteDocument = async (document_id: string): Promise<boolean> => {
  try {
    await client.delete(`/api/v1/documents/${document_id}`);
    return true;
  } catch (err) {
    console.error('Failed to delete document:', err);
    return false;
  }
};

export const executeQuery = async (document_id: string, question: string): Promise<QueryResponse> => {
  const res = await client.post('/api/v1/query', { document_id, question });
  const data = res.data;

  const severity = data.status === 'SUPPORTED' ? 'NONE' : (data.status === 'CONTRADICTED' ? 'HIGH' : 'MEDIUM');
  const diagType = data.status === 'SUPPORTED' ? 'No Failure - Grounded Response' : (
    data.status === 'CONTRADICTED' ? 'Likely Generation Failure' : 'Likely Retrieval Failure'
  );

  return {
    ...data,
    document_id,
    question,
    diagnosis: data.diagnosis || {
      type: diagType,
      reason: data.explanation || '',
      severity: severity,
    },
  };
};

export const fetchTraces = async (): Promise<TraceItem[]> => {
  try {
    const res = await client.get('/api/v1/traces');
    return res.data;
  } catch (err) {
    return [];
  }
};

export const fetchMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const res = await client.get('/api/v1/dashboard/metrics');
    return res.data;
  } catch (err) {
    return {
      total_queries: 0,
      total_failures: 0,
      failure_rate: 0.0,
      avg_evaluation_score: 1.0,
      avg_latency_ms: 0,
      failure_breakdown: {
        'Generation Failure': 0,
        'Retrieval Failure': 0,
        'Context Ambiguity': 0,
      },
    };
  }
};
