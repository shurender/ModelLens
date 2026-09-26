import React from 'react';
interface FailureChartProps {
  breakdown: Record<string, number>;
}
export const FailureChart: React.FC<FailureChartProps> = ({ breakdown }) => {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    'Generation Failure': { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500' },
    'Retrieval Failure': { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
    'Context Ambiguity': { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' },
    'Hallucination': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500' },
  };
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
        <span>Failure Type Breakdown</span>
        <span className="text-xs text-slate-400 font-normal font-mono">{total} Total Incidents</span>
      </h3>
      <div className="space-y-4">
        {Object.entries(breakdown).map(([type, count]) => {
          const percent = Math.round((count / total) * 100);
          const colors = colorMap[type] || { bg: 'bg-slate-700', text: 'text-slate-300', bar: 'bg-cyan-400' };
          return (
            <div key={type} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={`font-semibold ${colors.text}`}>{type}</span>
                <span className="text-slate-400">{count} ({percent}%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${colors.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
