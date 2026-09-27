import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Bot, 
  FileText, 
  CheckCircle2, 
  Zap, 
  Search, 
  Layers, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface HomePageProps {
  onOpenChat: () => void;
  isBackendOnline?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenChat, isBackendOnline = true }) => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Subtle Tech Dots */}
      <div className="absolute inset-0 bg-tech-dots pointer-events-none opacity-60" />

      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Bot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-zinc-950 tracking-tight">ModelLens</span>
            <span className="text-[10px] text-zinc-400 font-mono">Ground Truth Intelligence</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isBackendOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-zinc-600">{isBackendOnline ? 'Engine Online' : 'Connecting...'}</span>
          </div>

          <button
            onClick={onOpenChat}
            className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-mono font-medium flex items-center space-x-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Open Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-16 flex flex-col items-center text-center space-y-12">
        {/* Beacon Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 shadow-xs text-xs font-mono text-zinc-700 animate-slide-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-zinc-950">ENGINE READY</span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-500">Groq Accelerated · gpt-oss-120b</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-4 max-w-3xl animate-slide-up">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.15]">
            Ground Truth Intelligence for Enterprise Documents.
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate AI hallucinations. ModelLens ingests your policies, financials, and contracts, answers questions in real time, and verifies factual claims with exact page citations.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-slide-up">
          <button
            onClick={onOpenChat}
            className="px-7 py-3.5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-mono text-sm font-semibold flex items-center space-x-2.5 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <span>Launch Chat Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Section: What To Do (3 Steps) ────────────────────────────── */}
        <div className="w-full pt-8 space-y-6 text-left">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Workflow Guide
            </h2>
            <p className="text-2xl font-bold tracking-tight text-zinc-950">
              What To Do in ModelLens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-base text-zinc-950">Upload Any Document</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                Drag and drop your file into the chat dropzone. ModelLens extracts, chunks, and maps pages automatically across PDF, Word, TXT, Markdown, CSV, and JSON.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-base text-zinc-950">Ask in Natural Language</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                Use the ChatGPT-style bottom input bar to query specific facts, financial numbers, return policies, or clauses.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-base text-zinc-950">Inspect Verified Proof</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                Answers appear directly on screen with verification badges (Supported, Contradicted, Uncertain) and expandable page citations.
              </p>
            </div>
          </div>
        </div>

        {/* ── Section: How It Works ─────────────────────────────────────── */}
        <div className="w-full pt-8 space-y-6 text-left">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Under The Hood
            </h2>
            <p className="text-2xl font-bold tracking-tight text-zinc-950">
              How ModelLens Guarantees Truth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">TF-IDF Vector Chunk Retrieval</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Queries are matched against tokenized document chunks to retrieve exact source evidence passages in milliseconds, indexed by exact page numbers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">Automated Truth Judge & Contradiction Detection</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                An LLM evaluator verifies that every statement in the generated answer is strictly grounded in the retrieved text, flagging unsupported claims or numeric discrepancies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">Groq LLM Acceleration</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Powered by Groq's high-speed inference engine for ultra-low latency response generation and real-time grounding checks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">Multi-Format Universal Ingestion</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Seamlessly extracts content from PDFs (via PyMuPDF), Word documents (.docx), text files, Markdown, CSV, and JSON data.
              </p>
            </div>
          </div>
        </div>

        {/* ── Supported Formats Pill Strip ───────────────────────────────── */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-mono text-zinc-400 mr-2">Supported Formats:</span>
          {['PDF (.pdf)', 'Word (.docx)', 'Text (.txt)', 'Markdown (.md)', 'CSV (.csv)', 'JSON (.json)'].map((fmt) => (
            <span key={fmt} className="px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-2xs">
              {fmt}
            </span>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="w-full p-8 rounded-3xl bg-zinc-950 text-white flex flex-col sm:flex-row items-center justify-between text-left gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Ready to verify your documents?</h3>
            <p className="text-xs text-zinc-400 font-sans">
              Experience deterministic truth verification with exact page-level evidence citations.
            </p>
          </div>
          <button
            onClick={onOpenChat}
            className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <span>Launch Chat ➔</span>
          </button>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-zinc-200/80 bg-white/60 py-4 px-6 text-center text-xs font-mono text-zinc-400">
        ModelLens — Enterprise AI Grounding & Document Intelligence Engine
      </footer>
    </div>
  );
};
