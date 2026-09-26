import React from 'react';
import { HelpCircle, Database, FileText, Bot, CheckSquare, Stethoscope, AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { QueryResponse } from '../../types/api';
interface PipelineFlowProps {
  trace: QueryResponse;
}
export const PipelineFlow: React.FC<PipelineFlowProps> = ({ trace }) => {
  const statusColors = {
    SUPPORTED: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    CONTRADICTED: { bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
    NOT_FOUND: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
    UNCERTAIN: { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  };
  const statusStyle = statusColors[trace.status] || statusColors.SUPPORTED;
  const severityBadge = {
    NONE: 'bg-slate-800 text-slate-300 border-slate-700',
    LOW: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    HIGH: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }[trace.diagnosis.severity || 'NONE'];
  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
              TRACE ID: {trace.query_id}
            </span>
            <span className="text-xs font-mono text-slate-400">Latency: {trace.latency_ms}ms</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-2">Pipeline Execution & Root-Cause Trace</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">ModelLens Observability Graph</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-4 py-2 rounded-xl border font-mono font-bold text-sm flex items-center space-x-2 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
            {trace.status === 'SUPPORTED' && <CheckCircle2 className="w-5 h-5" />}
            {trace.status === 'CONTRADICTED' && <XCircle className="w-5 h-5" />}
            {trace.status === 'NOT_FOUND' && <AlertTriangle className="w-5 h-5" />}
            {trace.status === 'UNCERTAIN' && <ShieldAlert className="w-5 h-5" />}
            <span>{trace.status}</span>
          </div>
        </div>
      </div>
      {/* Step 1: Question */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-cyan-500 relative">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Stage 1: User Question Prompt</span>
        </div>
        <p className="text-base font-semibold text-slate-100 font-sans">{trace.question || 'What is the refund period?'}</p>
      </div>
      {/* Pipeline Connector */}
      <div className="flex justify-center">
        <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500 to-emerald-500" />
      </div>
      {/* Step 2: Vector Retrieval */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-emerald-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Stage 2: TF-IDF Vector Retrieval</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {trace.evidence.length} Chunks Retained
          </span>
        </div>
        {trace.evidence.length > 0 ? (
          <div className="space-y-2.5">
            {trace.evidence.map((chunk, idx) => (
              <div key={idx} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs flex items-start justify-between">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    Page {chunk.page}
                  </span>
                  <p className="text-slate-300 font-mono mt-1">{chunk.text}</p>
                </div>
                <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 ml-4 flex-shrink-0">
                  Score: {(chunk.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-mono">
            ⚠️ No matching evidence passages were retrieved from the document database.
          </div>
        )}
      </div>
      {/* Pipeline Connector */}
      <div className="flex justify-center">
        <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-purple-500" />
      </div>
      {/* Step 3: Exact Source Evidence */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-purple-500">
        <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          <span>Stage 3: Grounding Source Evidence Passage</span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-200">
          {trace.evidence.length > 0 ? trace.evidence[0].text : 'No source evidence available.'}
        </div>
      </div>
      {/* Pipeline Connector */}
      <div className="flex justify-center">
        <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-rose-500" />
      </div>
      {/* Step 4: Generated Answer */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-blue-500">
        <div className="flex items-center space-x-2 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Bot className="w-4 h-4" />
          <span>Stage 4: LLM Generated Response</span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-sm font-sans text-slate-100">
          {trace.answer}
        </div>
      </div>
      {/* Pipeline Connector */}
      <div className="flex justify-center">
        <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500" />
      </div>
      {/* Step 5: Root-Cause Diagnosis (Main Hackathon Visual Output) */}
      <div className={`glass-panel p-6 rounded-2xl border-2 ${statusStyle.border} ${statusStyle.bg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Stethoscope className="w-5 h-5 text-cyan-400" />
            <span>Stage 5: ModelLens Automated Diagnosis</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase ${severityBadge}`}>
            SEVERITY: {trace.diagnosis.severity || 'NONE'}
          </span>
        </div>
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Likely Root Cause:</span>
            <span className="text-base font-extrabold text-white font-mono tracking-tight">{trace.diagnosis.type}</span>
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">Diagnostic Rationale:</span>
            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              {trace.diagnosis.reason}
            </p>
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">Evaluation Explanation:</span>
            <p className="text-xs text-slate-400 font-sans italic">{trace.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
