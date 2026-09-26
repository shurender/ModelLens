import { QueryResponse, DocumentInfo, TraceItem, DashboardMetrics } from '../types/api';
import { localApi } from '../services/localBackend';

export const checkHealth = async (): Promise<boolean> => true;

export const uploadDocument = async (file: File): Promise<DocumentInfo> => localApi.uploadPDF(file);

export const fetchDocuments = async (): Promise<DocumentInfo[]> => localApi.getDocuments();

export const executeQuery = async (document_id: string, question: string): Promise<QueryResponse> => localApi.query(document_id, question);

export const fetchTraces = async (): Promise<TraceItem[]> => localApi.getTraces();

export const fetchMetrics = async (): Promise<DashboardMetrics> => localApi.getMetrics();
