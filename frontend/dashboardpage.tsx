import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Clock, Zap } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { FailureChart } from '../components/dashboard/FailureChart';
import { fetchMetrics } from '../api/client';
import { DashboardMetrics } from '../types/api';
export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  useEffect(() => {
    fetchMetrics().then(setMetrics);
  }, []);
  if (!metrics) return null;
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Observability Dashboard</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Real-time LLM evaluation scores, grounding failures, and execution latencies</p>
      </div>
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Queries"
          value={metrics.total_queries}
          subtitle="Processed evaluations"
          icon={Activity}
          color="cyan"
        />
        <MetricCard
          title="Failure Count"
          value={metrics.total_failures}
          subtitle={`Failure rate: ${(metrics.failure_rate * 100).toFixed(1)}%`}
          icon={AlertTriangle}
          color="rose"
        />
        <MetricCard
          title="Avg Grounding Score"
          value={`${(metrics.avg_evaluation_score * 100).toFixed(0)}%`}
          subtitle="Evidence alignment rating"
          icon={ShieldCheck}
          color="emerald"
        />
        <MetricCard
          title="Avg Latency"
          value={`${metrics.avg_latency_ms}ms`}
          subtitle="End-to-end response time"
          icon={Clock}
          color="amber"
        />
      </div>
      {/* Breakdown Chart & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FailureChart breakdown={metrics.failure_breakdown} />
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>ModelLens Observability Guarantee</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">
              ModelLens captures full evidence trails for every AI interaction. It evaluates whether failures are caused by vector retrieval gaps or LLM generation hallucinations.
            </p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400">
            ✓ 100% Deterministic Root-Cause Attribution Engine Active
          </div>
        </div>
      </div>
    </div>
  );
};
