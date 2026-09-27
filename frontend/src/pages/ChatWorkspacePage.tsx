import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  Plus, 
  Layers,
  Sparkles,
  FileCheck,
  Trash2,
  ArrowUp,
  Copy,
  Check,
  ShieldCheck,
  FileSearch
} from 'lucide-react';
import { DocumentInfo, QueryResponse, EvidenceItem } from '../types/api';
import { executeQuery, uploadDocument, fetchDocuments, deleteDocument, API_BASE_URL } from '../api/client';

interface ChatWorkspacePageProps {
  onBackToHome?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: QueryResponse;
  timestamp: string;
  documentName?: string;
}

export const ChatWorkspacePage: React.FC<ChatWorkspacePageProps> = ({
  onBackToHome,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load uploaded documents on mount
  useEffect(() => {
    fetchDocuments().then((docs) => {
      if (docs && docs.length > 0) {
        setDocuments(docs);
        setSelectedDoc(docs[0]);
      } else {
        setDocuments([]);
        setSelectedDoc(null);
      }
    });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const toggleEvidence = (msgId: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const newDoc = await uploadDocument(file);
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
    } catch (err: any) {
      console.error('Upload failed:', err);
      const detail = err.response?.data?.detail;
      const isNetworkErr = !err.response || err.code === 'ERR_NETWORK';
      const msg = detail || (isNetworkErr
        ? `Unable to connect to backend API (${API_BASE_URL}). If using Vercel, please set VITE_API_BASE_URL to your deployed backend URL in Vercel Project Settings.`
        : 'Failed to upload document.');
      alert(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    await deleteDocument(docId);
    const remaining = documents.filter((d) => d.id !== docId);
    setDocuments(remaining);
    if (selectedDoc?.id === docId) {
      if (remaining.length > 0) {
        setSelectedDoc(remaining[0]);
      } else {
        setSelectedDoc(null);
        setMessages([]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSendMessage = async (overrideQuestion?: string) => {
    const question = (overrideQuestion ?? inputQuestion).trim();
    if (!question || isQuerying) return;

    if (!selectedDoc) {
      alert('Please attach a document first.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      documentName: selectedDoc.filename,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsQuerying(true);

    try {
      const res = await executeQuery(selectedDoc.id, question);
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        documentName: selectedDoc.filename,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Query error:', err);
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to process query. Please check if the backend server is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const statusConfig = {
    SUPPORTED: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-sm',
      icon: CheckCircle2,
      label: 'SUPPORTED',
    },
    CONTRADICTED: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200/90 shadow-sm',
      icon: XCircle,
      label: 'CONTRADICTED',
    },
    NOT_FOUND: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200/90 shadow-sm',
      icon: AlertTriangle,
      label: 'NOT FOUND',
    },
    UNCERTAIN: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/90 shadow-sm',
      icon: HelpCircle,
      label: 'UNCERTAIN',
    },
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-zinc-950 font-sans overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
        accept=".pdf,.docx,.txt,.md,.csv,.json,.py,.yaml,.xml"
      />

      {/* ── Left Sidebar (ChatGPT-style Workspace Sidebar) ────────────────── */}
      <aside className="w-64 border-r border-zinc-200 bg-[#F9FAFB] flex flex-col justify-between hidden md:flex z-20 transition-all">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Branding & Action Row */}
          <div className="p-3 border-b border-zinc-200/70 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
                  <Bot className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-zinc-950 tracking-tight">ModelLens</span>
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Engine Online</span>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 text-zinc-600 font-medium">v1.0</span>
            </div>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home Page</span>
              </button>
            )}

            <button
              onClick={() => {
                setMessages([]);
                setInputQuestion('');
              }}
              className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100/90 text-zinc-800 hover:text-zinc-950 border border-zinc-200/80 text-xs font-mono font-medium flex items-center justify-between transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              title="Start a new chat session"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-zinc-600" />
                <span>New Chat</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">⌘K</span>
            </button>
          </div>

          {/* Document Section Header */}
          <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            <span>Documents</span>
            {documents.length > 0 && (
              <span className="text-[10px] bg-zinc-200/60 px-1.5 py-0.2 rounded text-zinc-600 font-semibold">
                {documents.length}
              </span>
            )}
          </div>

          {/* Document Items List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`group w-full text-left p-2.5 rounded-lg text-xs font-mono flex items-center justify-between border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-zinc-300 text-zinc-950 font-semibold shadow-sm translate-x-0.5'
                      : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate flex-1 min-w-0 mr-1">
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`} />
                    <span className="truncate">{doc.filename}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <span className="text-[10px] text-zinc-400 font-mono group-hover:hidden">
                      {doc.pages}p
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDocument(e, doc.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-100 text-zinc-400 hover:text-rose-600 transition-all hover:scale-110 active:scale-95"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-zinc-200/70 bg-white/50 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>ModelLens Engine</span>
            </span>
            <span className="text-zinc-400 text-[10px]">v1.0</span>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFDFD] relative">
        {/* Top Header */}
        <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer text-xs font-mono"
                title="Back to Home Page"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </button>
            )}

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="font-bold text-zinc-950">ModelLens</span>
              {selectedDoc && (
                <>
                  <span className="text-zinc-300">/</span>
                  <div className="inline-flex items-center space-x-1.5 bg-zinc-100/80 px-2.5 py-0.5 rounded-full border border-zinc-200 text-zinc-700 max-w-[220px] transition-all hover:bg-zinc-100">
                    <FileCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{selectedDoc.filename}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline text-zinc-500">Truth Engine Ready</span>
          </div>
        </header>

        {/* Messages / Central Workspace Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-7">
          {messages.length === 0 ? (
            /* ── Clean ChatGPT-Style Empty State ──────── */
            <div className="max-w-xl mx-auto h-full flex flex-col justify-center items-center text-center space-y-6 py-12 animate-slide-up">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shadow-lg animate-float">
                <Bot className="w-7 h-7 text-white stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                  ModelLens Document Intelligence
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Upload any document to ask questions with real-time factual verification and page citations.
                </p>
              </div>

              {selectedDoc ? (
                /* Document Ready Status Card */
                <div className="w-full p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-between text-left transition-all hover:shadow-md animate-slide-up">
                  <div className="flex items-center space-x-3.5 truncate">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-mono font-bold text-zinc-950 truncate">
                        {selectedDoc.filename}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {selectedDoc.pages} {selectedDoc.pages === 1 ? 'page' : 'pages'} · Ready for queries
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono border border-zinc-200 ml-3 flex-shrink-0 transition-all active:scale-95 shadow-sm"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                /* Interactive Central Dropzone Card with Drag & Hover Glow */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group w-full p-8 rounded-2xl border-2 border-dashed bg-white flex flex-col items-center justify-center space-y-3 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 ${
                    isDragging
                      ? 'border-zinc-950 bg-zinc-50 scale-[1.02] shadow-xl'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 group-hover:bg-zinc-200/80 flex items-center justify-center text-zinc-600 transition-all duration-300 group-hover:scale-110">
                    <Upload className="w-5 h-5 text-zinc-800 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-zinc-900 group-hover:text-black">
                      {isUploading ? 'Ingesting Document...' : 'Drop or attach your document here'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── ChatGPT-Style Message Stream (Direct Output On Screen) ────────── */
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const status = msg.response?.status;
                const statusMeta = status ? (statusConfig[status] || statusConfig.SUPPORTED) : null;
                const StatusIcon = statusMeta?.icon;
                const isEvExpanded = expandedEvidence[msg.id] ?? false;

                if (isUser) {
                  return (
                    /* User Question — Clean pill aligned right like ChatGPT */
                    <div key={msg.id} className="flex justify-end animate-slide-up">
                      <div className="max-w-[75%] bg-[#F4F4F4] hover:bg-[#EAEAEA] text-zinc-900 rounded-[24px] px-5 py-3 text-[15.5px] sm:text-base leading-relaxed transition-colors font-sans select-text">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  /* Assistant Output — DIRECT ON SCREEN with NO restrictive box */
                  <div key={msg.id} className="flex items-start space-x-3.5 sm:space-x-4 animate-slide-up">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5">
                      <Bot className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                      {/* Direct Output Text — Prominent, large, readable font (ChatGPT standard) */}
                      <div className="text-[16px] sm:text-[17px] leading-7 sm:leading-8 text-zinc-900 font-normal whitespace-pre-wrap select-text">
                        {msg.text}
                      </div>

                      {/* Verification Status & Action Controls Strip */}
                      {msg.response && (
                        <div className="pt-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors font-mono text-[11px]"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Status Pill Badge */}
                            {statusMeta && (
                              <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border ${statusMeta.badge}`}>
                                {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                                <span>{statusMeta.label}</span>
                                <span className="opacity-60">•</span>
                                <span>{Math.round(msg.response.confidence * 100)}% Match</span>
                              </div>
                            )}

                            {/* Fact-Check & Sources Toggle */}
                            {(msg.response.explanation || (msg.response.evidence && msg.response.evidence.length > 0)) && (
                              <button
                                type="button"
                                onClick={() => toggleEvidence(msg.id)}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                                  isEvExpanded 
                                    ? 'bg-zinc-200 text-zinc-950 font-semibold' 
                                    : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                                }`}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Fact-Check & Sources ({msg.response.evidence?.length || 0})</span>
                                {isEvExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}

                            <span className="text-[11px] text-zinc-400 font-mono ml-auto">
                              {msg.response.latency_ms}ms
                            </span>
                          </div>

                          {/* Expandable Fact Check Drawer (Clean, large text, not a cramped small box) */}
                          {isEvExpanded && (
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3.5 shadow-sm animate-slide-up">
                              {msg.response.explanation && (
                                <div className="space-y-1">
                                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                                    Verification Reasoning
                                  </div>
                                  <div className="text-sm leading-relaxed text-zinc-700 font-sans">
                                    {msg.response.explanation}
                                  </div>
                                </div>
                              )}

                              {msg.response.evidence && msg.response.evidence.length > 0 && (
                                <div className="space-y-2 pt-1 border-t border-zinc-100">
                                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                                    Document Passages Cited
                                  </div>
                                  <div className="space-y-2">
                                    {msg.response.evidence.map((ev: EvidenceItem, idx: number) => (
                                      <div
                                        key={idx}
                                        className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                                          <span className="text-zinc-900 font-semibold bg-zinc-200/70 px-2 py-0.5 rounded">
                                            Page {ev.page}
                                          </span>
                                          <span>Similarity: {ev.score.toFixed(4)}</span>
                                        </div>
                                        <div className="text-zinc-800 text-[13px] leading-relaxed italic border-l-2 border-zinc-400 pl-2.5">
                                          "{ev.text}"
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isQuerying && (
                <div className="flex items-start space-x-3.5 justify-start animate-slide-up">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5">
                    <Bot className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-zinc-600 pt-1.5 font-sans">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-800 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-950" />
                    </span>
                    <span>Verifying against document evidence...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Centered Floating ChatGPT-Style Input Bar ────────────────────── */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD] to-transparent">
          <div className="max-w-3xl mx-auto space-y-2.5">
            <div className="relative rounded-[26px] bg-[#F4F4F4] focus-within:bg-white border border-transparent focus-within:border-zinc-300 shadow-sm focus-within:shadow-md transition-all p-2.5 flex flex-col gap-1.5">
              {/* If doc is attached, show chip inside the input container at top */}
              {selectedDoc && (
                <div className="flex items-center space-x-2 pl-2 pt-0.5">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-xs font-mono text-zinc-800 shadow-xs">
                    <FileText className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                    <span className="font-semibold truncate max-w-[260px]">{selectedDoc.filename}</span>
                    <span className="text-[10px] text-zinc-400">· {selectedDoc.pages}p</span>
                  </div>
                </div>
              )}

              {/* Input row */}
              <div className="flex items-end pl-1 pr-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-9 h-9 rounded-full text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/80 transition-all flex items-center justify-center flex-shrink-0 mb-0.5"
                  title="Attach File"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedDoc ? `Ask about ${selectedDoc.filename}...` : "Attach a document above to begin asking..."}
                  rows={1}
                  disabled={isQuerying || !selectedDoc}
                  className="flex-1 bg-transparent text-[16px] text-zinc-900 placeholder-zinc-400 px-3 py-1.5 focus:outline-none resize-none font-sans disabled:opacity-50 max-h-36 overflow-y-auto leading-6"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuestion.trim() || isQuerying || !selectedDoc}
                  className="w-8 h-8 rounded-full bg-black hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-black text-white flex items-center justify-center flex-shrink-0 transition-all shadow-sm active:scale-90 mb-0.5"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="text-center text-[11px] text-zinc-400 font-sans tracking-wide">
              ModelLens verifies responses against source evidence to eliminate hallucinations.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
