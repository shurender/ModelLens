import React from 'react';
interface AppShellProps {
  children: React.ReactNode;
}
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <p>ModelLens Lite — Grounded Answer Checker & AI Observability Platform • Hackathon Edition</p>
      </footer>
    </div>
  );
};
