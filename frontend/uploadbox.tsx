import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../../api/client';
import { DocumentInfo } from '../../types/api';
interface UploadBoxProps {
  onUploadSuccess: (doc: DocumentInfo) => void;
}
export const UploadBox: React.FC<UploadBoxProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] = useState<DocumentInfo | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const doc = await uploadDocument(selectedFile);
      setSuccessDoc(doc);
      onUploadSuccess(doc);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to process and index PDF.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
        <FileText className="w-5 h-5 text-cyan-400" />
        <span>Upload PDF Document</span>
      </h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const f = e.dataTransfer.files[0];
            if (f.name.toLowerCase().endsWith('.pdf')) {
              setSelectedFile(f);
              setError(null);
            } else {
              setError('Only PDF files are accepted.');
            }
          }
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
        />
        <label htmlFor="pdf-upload-input" className="cursor-pointer block">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-400 font-mono">{selectedFile.name}</p>
              <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • PDF Document</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Click to browse or drag & drop PDF policy
              </p>
              <p className="text-xs text-slate-500 font-mono">Maximum file size: 10MB</p>
            </div>
          )}
        </label>
      </div>
      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successDoc && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-emerald-400 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Document indexed successfully (ID: {successDoc.id})</span>
          </div>
          <span className="text-emerald-500 font-bold">{successDoc.pages} Pages</span>
        </div>
      )}
      {selectedFile && !successDoc && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Parsing PDF & Indexing Chunks...</span>
            </>
          ) : (
            <span>Process & Index Document</span>
          )}
        </button>
      )}
    </div>
  );
};
