import React, { useState } from 'react';
import { History, Filter, ArrowUpRight, Search } from 'lucide-react';
import { TraceItem } from '../../types/api';
interface TraceTableProps {
  traces: TraceItem[];
  onSelectTrace: (traceId: string) => void;
}
export const TraceTable: React.FC<TraceTableProps> = ({ traces, onSelectTrace }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const filteredTraces = traces.filter((t) => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesSearch =
      t.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.diagnosis_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const statusBadges: Record<string, string> = {
    SUPPORTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    CONTRADICTED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    NOT_FOUND: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    UNCERTAIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Execution Trace History & Observability Log</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Filter by grounding status or search queries</p>
        </div>
        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search traces..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            {['ALL', 'SUPPORTED', 'CONTRADICTED', 'NOT_FOUND', 'UNCERTAIN'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterStatus === status ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Query ID</th>
              <th className="py-3 px-4">Question</th>
              <th className="py-3 px-4">Grounding Status</th>
              <th className="py-3 px-4">Likely Root Cause</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTraces.length > 0 ? (
              filteredTraces.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors group">
                  <td className="py-3 px-4 font-bold text-slate-300">{t.id}</td>
                  <td className="py-3 px-4 font-sans text-slate-200 max-w-xs truncate">{t.question}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusBadges[t.status] || ''}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-300">{t.diagnosis_type}</td>
                  <td className="py-3 px-4 text-slate-400">{t.latency_ms}ms</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectTrace(t.id)}
                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                  No execution traces match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
