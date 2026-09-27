import React, { useState, useEffect } from 'react';
import { ChatWorkspacePage } from './pages/ChatWorkspacePage';
import { checkHealth } from './api/client';

export const App: React.FC = () => {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    checkHealth().then(setIsBackendOnline);
    const interval = setInterval(() => {
      checkHealth().then(setIsBackendOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#FDFDFD] text-zinc-900 font-sans selection:bg-zinc-200">
      <ChatWorkspacePage />
    </div>
  );
};

export default App;

