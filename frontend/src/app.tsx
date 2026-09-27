import React, { useState, useEffect, useCallback } from 'react';
import { HomePage } from './pages/HomePage';
import { ChatWorkspacePage } from './pages/ChatWorkspacePage';
import { checkHealth } from './api/client';

export type AppView = 'home' | 'chat';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  const verifyHealth = useCallback(async () => {
    const online = await checkHealth();
    setIsBackendOnline(online);
    return online;
  }, []);

  useEffect(() => {
    verifyHealth();

    // Check frequently (every 4s) while waking up; once online, relax to every 25s
    const pollInterval = isBackendOnline ? 25000 : 4000;
    const interval = setInterval(verifyHealth, pollInterval);
    return () => clearInterval(interval);
  }, [verifyHealth, isBackendOnline]);

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
          <ChatWorkspacePage 
            onBackToHome={() => {
              verifyHealth();
              setCurrentView('home');
            }}
            isBackendOnline={isBackendOnline}
            onBackendOnline={() => setIsBackendOnline(true)}
          />
        </div>
      )}
    </div>
  );
};

export default App;

