import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FolderLock,
  FileText,
  Filter,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { UserDocument, DocumentCustomField } from '../../types/database';
import { DocumentCard } from './DocumentCard';
import { DocumentFormModal } from './DocumentFormModal';
import { DocumentDetailModal } from './DocumentDetailModal';
import { storage } from '../../lib/storage';

interface DocumentListProps {
  documents: UserDocument[];
  onAddDocument: (doc: {
    name: string;
    doc_number?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    custom_fields: DocumentCustomField[];
  }) => void;
  onUpdateDocument: (id: string, updates: Partial<UserDocument>) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<UserDocument | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'files' | 'id'>('all');

  // Filtered documents based on search and chip
  const filteredDocuments = useMemo(() => {
    let result = documents;

    // Filter by type
    if (activeFilter === 'files') {
      result = result.filter((d) => d.file_url || d.file_name);
    } else if (activeFilter === 'id') {
      result = result.filter(
        (d) =>
          d.doc_number ||
          d.name.toLowerCase().includes('id') ||
          d.name.toLowerCase().includes('license') ||
          d.name.toLowerCase().includes('passport')
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesNumber = d.doc_number ? d.doc_number.toLowerCase().includes(q) : false;
        const matchesCustomField = (d.custom_fields || []).some(
          (f) => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)
        );
        return matchesName || matchesNumber || matchesCustomField;
      });
    }

    return result;
  }, [documents, searchQuery, activeFilter]);

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (doc: UserDocument) => {
    setEditingDoc(doc);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: {
    name: string;
    doc_number?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    custom_fields: DocumentCustomField[];
  }) => {
    if (editingDoc) {
      onUpdateDocument(editingDoc.id, data);
      // If the currently viewed document is being edited, update its reference
      if (selectedDoc?.id === editingDoc.id) {
        setSelectedDoc({ ...editingDoc, ...data, updated_at: new Date().toISOString() });
      }
    } else {
      onAddDocument(data);
    }
  };

  return (
    <div className="min-h-full bg-[#f6f4ee] text-stone-900 px-5 pt-4 pb-24 font-sans select-none antialiased">
      {/* Top Banner / Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Documents Vault</span>
            <FolderLock className="w-5 h-5 text-[#223326]" />
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {documents.length} secure personal {documents.length === 1 ? 'document' : 'documents'}
          </p>
        </div>

        {/* Add Document Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] transition active:scale-95 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, number, or custom field..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200/80 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700 p-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeFilter === 'all'
              ? 'bg-[#223326] text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
          }`}
        >
          All ({documents.length})
        </button>
        <button
          onClick={() => setActiveFilter('files')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 flex items-center gap-1 ${
            activeFilter === 'files'
              ? 'bg-[#223326] text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Paperclip className="w-3 h-3" />
          <span>With Files</span>
        </button>
        <button
          onClick={() => setActiveFilter('id')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeFilter === 'id'
              ? 'bg-[#223326] text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
          }`}
        >
          ID & Policies
        </button>
      </div>

      {/* Document Cards List */}
      <div className="space-y-2.5">
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-[26px] p-8 text-center border border-stone-200/70 shadow-2xs">
            <FileText className="w-10 h-10 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-stone-800">
              {searchQuery ? 'No matching documents found' : 'No documents added yet'}
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Try a different keyword or clear your search query.'
                : 'Safely store IDs, policies, vehicle cards, and warranties with custom fields and attachments.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] transition shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Your First Document</span>
            </button>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={(d) => setSelectedDoc(d)}
            />
          ))
        )}
      </div>

      {/* Document Form Modal (Add / Edit) */}
      <DocumentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialDocument={editingDoc}
      />

      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
        onEdit={handleOpenEdit}
        onDelete={onDeleteDocument}
      />
    </div>
  );
};
