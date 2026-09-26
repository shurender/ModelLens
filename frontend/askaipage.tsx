import React, { useState } from 'react';
import { QuestionBox } from '../components/chat/QuestionBox';
import { GroundedAnswer } from '../components/chat/GroundedAnswer';
import { executeQuery } from '../api/client';
import { QueryResponse } from '../types/api';
interface AskAIPageProps {
  selectedDocId: string;
  onViewTrace: (response: QueryResponse) => void;
}
export const AskAIPage: React.FC<AskAIPageProps> = ({ selectedDocId, onViewTrace }) => {
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const handleAskQuestion = async (q: string) => {
    setLoading(true);
    try {
      const res = await executeQuery(selectedDocId, q);
      setQueryResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Ask AI & Grounding Evaluator</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Generate AI answers grounded strictly in retrieved document evidence and verify support status</p>
      </div>
      <QuestionBox
        onSubmitQuestion={handleAskQuestion}
        loading={loading}
        selectedDocName={selectedDocId}
      />
      {queryResult && (
        <GroundedAnswer
          response={queryResult}
          onViewTrace={() => onViewTrace(queryResult)}
        />
      )}
    </div>
  );
};
