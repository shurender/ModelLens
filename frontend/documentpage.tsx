import React, { useEffect, useState } from 'react';
import { UploadBox } from '../components/upload/UploadBox';
import { DocumentList } from '../components/upload/DocumentList';
import { fetchDocuments } from '../api/client';
import { DocumentInfo } from '../types/api';
interface DocumentsPageProps {
  onSelectDocument: (docId: string) => void;
}
export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onSelectDocument }) => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_refund_policy');
  useEffect(() => {
    fetchDocuments().then((docs) => {
      setDocuments(docs);
      if (docs.length > 0) setSelectedDocId(docs[0].id);
    });
  }, []);
  const handleUploadSuccess = (newDoc: DocumentInfo) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
    onSelectDocument(newDoc.id);
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Document Knowledge Base</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Upload PDF policy files to extract text chunks and populate vector knowledge index</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UploadBox onUploadSuccess={handleUploadSuccess} />
        <DocumentList
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDoc={(id) => {
            setSelectedDocId(id);
            onSelectDocument(id);
          }}
        />
      </div>
    </div>
  );
};
