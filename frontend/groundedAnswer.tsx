import React from 'react';
import { Bot, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { QueryResponse } from '../../types/api';
interface GroundedAnswerProps {
  response: QueryResponse;
  onViewTrace: () => void;
}
export const GroundedAnswer: React.FC<GroundedAnswerProps> = ({ response, onViewTrace }) => {
  const statusConfig = {
    SUPPORTED: {
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'SUPPORTED BY EVIDENCE',
    },
    CONTRADICTED: {
      color: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: XCircle,
      label: 'CONTRADICTED BY EVIDENCE',
    },
    NOT_FOUND: {
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: AlertTriangle,
      label: 'EVIDENCE NOT FOUND',
    },
    UNCERTAIN: {
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: HelpCircle,
      label: 'UNCERTAIN GROUNDING',
    },
  };
  const currentStatus = statusConfig[response.status] || statusConfig.SUPPORTED;
  const StatusIcon = currentStatus.icon;
  return (
    <div className={`glass-panel p-6 rounded-2xl border-l-4 ${currentStatus.color}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-slate-100">Model Response</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${currentStatus.badge}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{currentStatus.label}</span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            {response.latency_ms}ms
          </span>
        </div>
      </div>
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-4">
        <p className="text-sm text-slate-200 leading-relaxed font-sans">{response.answer}</p>
      </div>
      {/* Diagnosis Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400 font-mono">Diagnosis: </span>
          <span className="font-bold text-white font-mono">{response.diagnosis.type}</span>
          <p className="text-slate-400 mt-0.5">{response.diagnosis.reason}</p>
        </div>
        <button
          onClick={onViewTrace}
          className="mt-3 sm:mt-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono font-semibold transition-all text-xs flex-shrink-0"
        >
          <span>Inspect Full Pipeline Trace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
