import React from 'react';
import { PipelineFlow } from '../components/trace/PipelineFlow';
import { QueryResponse } from '../types/api';
import { ArrowLeft } from 'lucide-react';
interface TraceViewPageProps {
  currentTrace: QueryResponse | null;
  onBackToChat: () => void;
}
export const TraceViewPage: React.FC<TraceViewPageProps> = ({ currentTrace, onBackToChat }) => {
  if (!currentTrace) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl max-w-2xl mx-auto my-12 space-y-4">
        <h2 className="text-xl font-bold text-white">No Execution Trace Selected</h2>
        <p className="text-xs text-slate-400 font-mono">Run a question query from the Ask AI tab or click any trace from History to inspect the full pipeline visual graph.</p>
        <button
          onClick={onBackToChat}
          className="py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Ask AI Screen</span>
        </button>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBackToChat}
        className="flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Interactive Q&A</span>
      </button>
      <PipelineFlow trace={currentTrace} />
    </div>
  );
};
