import React from 'react';
import { ShieldCheck, LayoutDashboard, FileText, MessageSquare, GitCommit, History, Activity } from 'lucide-react';
interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean;
}
export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isBackendOnline }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'chat', label: 'Ask AI', icon: MessageSquare },
    { id: 'trace', label: 'Trace View', icon: GitCommit, highlight: true },
    { id: 'history', label: 'History', icon: History },
  ];
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ModelLens
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                Lite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">AI Answer Grounding & Observability</p>
          </div>
        </div>
        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="hidden md:inline">{item.label}</span>
                {item.highlight && (
                  <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
        {/* Backend Status Indicator */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono">
          <Activity className={`w-3.5 h-3.5 ${isBackendOnline ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="hidden sm:inline text-slate-400">Backend:</span>
          <span className={isBackendOnline ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {isBackendOnline ? 'Online (Render/Local)' : 'Mock Mode'}
          </span>
        </div>
      </div>
    </header>
  );
};
