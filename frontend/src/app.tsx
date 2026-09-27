import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ChatWorkspacePage } from './pages/ChatWorkspacePage';
import { checkHealth } from './api/client';

export type AppView = 'home' | 'chat';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    checkHealth().then(setIsBackendOnline);
    const interval = setInterval(() => {
      checkHealth().then(setIsBackendOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 font-sans selection:bg-zinc-200">
      {currentView === 'home' && (
        <HomePage 
          onOpenChat={() => setCurrentView('chat')} 
          isBackendOnline={isBackendOnline} 
        />
      )}

      {currentView === 'chat' && (
        <div className="h-screen w-screen overflow-hidden">
          <ChatWorkspacePage onBackToHome={() => setCurrentView('home')} />
        </div>
      )}
    </div>
  );
};

export default App;

