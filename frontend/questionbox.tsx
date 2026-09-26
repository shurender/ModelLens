import React, { useState } from 'react';
import { Send, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
interface QuestionBoxProps {
  onSubmitQuestion: (question: string) => void;
  loading: boolean;
  selectedDocName?: string;
}
export const QuestionBox: React.FC<QuestionBoxProps> = ({
  onSubmitQuestion,
  loading,
  selectedDocName = 'refund_policy.pdf',
}) => {
  const [question, setQuestion] = useState('');
  const sampleQuestions = [
    { text: 'What is the refund period?', label: 'Supported Query', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
    { text: 'What is the refund period? (Test 60 days contradiction)', label: 'Trigger Contradiction', color: 'border-rose-500/30 text-rose-400 bg-rose-500/5' },
    { text: 'What is the company\'s Mars travel policy?', label: 'Trigger Not Found', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
    { text: 'What is the leave carry-forward limit?', label: 'Trigger Uncertainty', color: 'border-purple-500/30 text-purple-400 bg-purple-500/5' },
  ];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onSubmitQuestion(question);
    }
  };
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>Ask Question Grounded in Knowledge Base</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
          Target: {selectedDocName}
        </span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type a question to verify grounded AI answer against retrieved document evidence..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="absolute right-3 bottom-3 py-1.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Run Diagnostic</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
      {/* Preset Test Case Launchers */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <p className="text-xs text-slate-400 font-semibold mb-2.5 flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Hackathon Test Cases (Click to populate & execute):</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(sq.text);
                onSubmitQuestion(sq.text);
              }}
              className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all hover:scale-[1.01] ${sq.color}`}
            >
              <span className="block font-bold text-[10px] uppercase tracking-wider mb-0.5 opacity-80">{sq.label}</span>
              <span className="text-slate-200 line-clamp-1">{sq.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
