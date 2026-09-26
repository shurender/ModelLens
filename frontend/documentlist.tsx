import React from 'react';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { DocumentInfo } from '../../types/api';
interface DocumentListProps {
  documents: DocumentInfo[];
  selectedDocId: string;
  onSelectDoc: (docId: string) => void;
}
export const DocumentList: React.FC<DocumentListProps> = ({ documents, selectedDocId, onSelectDoc }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
        <span className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <span>Indexed Knowledge Base</span>
        </span>
        <span className="text-xs text-slate-400 font-mono">{documents.length} Files</span>
      </h3>
      <div className="space-y-2.5">
        {documents.map((doc) => {
          const isSelected = selectedDocId === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 font-mono">{doc.filename}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>{doc.pages} Pages</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Ready</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
