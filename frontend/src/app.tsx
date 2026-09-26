import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AskAIPage } from './pages/AskAIPage';
import { TraceViewPage } from './pages/TraceViewPage';
import { HistoryPage } from './pages/HistoryPage';
import { QueryResponse } from './types/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_refund_policy');
  const [currentTrace, setCurrentTrace] = useState<QueryResponse | null>(null);

  const handleInspectTrace = (trace: QueryResponse) => {
    setCurrentTrace(trace);
    setActiveTab('trace');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isBackendOnline={true} />
      <AppShell>
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'documents' && (
          <DocumentsPage
            onSelectDocument={(docId) => {
              setSelectedDocId(docId);
              setActiveTab('chat');
            }}
          />
        )}
        {activeTab === 'chat' && (
          <AskAIPage
            selectedDocId={selectedDocId}
            onViewTrace={handleInspectTrace}
          />
        )}
        {activeTab === 'trace' && (
          <TraceViewPage
            currentTrace={currentTrace}
            onBackToChat={() => setActiveTab('chat')}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage onSelectTrace={handleInspectTrace} />
        )}
      </AppShell>
    </div>
  );
};

export default App;
