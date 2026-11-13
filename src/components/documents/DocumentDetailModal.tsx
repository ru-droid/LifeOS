import React, { useState } from 'react';
import {
  X,
  FileText,
  FileImage,
  Download,
  Edit3,
  Trash2,
  Hash,
  Eye,
  Maximize2,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { UserDocument } from '../../types/database';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UserDocument | null;
  onEdit: (doc: UserDocument) => void;
  onDelete: (id: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document,
  onEdit,
  onDelete,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !document) return null;

  const isPdf =
    document.file_type === 'application/pdf' ||
    document.file_name?.toLowerCase().endsWith('.pdf');
  const isImage =
    document.file_type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(document.file_name || '');

  const handleDownload = () => {
    if (!document.file_url) return;
    const a = window.document.createElement('a');
    a.href = document.file_url;
    a.download = document.file_name || `${document.name}.${isPdf ? 'pdf' : 'png'}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleDelete = () => {
    onDelete(document.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-2xl bg-[#223326]/10 text-[#223326] flex items-center justify-center flex-shrink-0">
                {isImage ? (
                  <FileImage className="w-5 h-5 stroke-[2]" />
                ) : (
                  <FileText className="w-5 h-5 stroke-[2]" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-stone-900 tracking-tight truncate">
                  {document.name}
                </h3>
                {document.doc_number && (
                  <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                    <Hash className="w-3 h-3 text-stone-400" />
                    <span className="truncate">{document.doc_number}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
            {/* Custom Fields Section */}
            {document.custom_fields && document.custom_fields.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Document Details
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {document.custom_fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70"
                    >
                      <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider truncate">
                        {field.label}
                      </div>
                      <div className="text-xs font-bold text-stone-900 mt-0.5 break-words">
                        {field.value || '—'}
                      </div>
                      {field.show_on_card && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Shown on card
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Embedded File Viewer / Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Attached File Preview
                </h4>
                {document.file_name && (
                  <span className="text-[11px] text-stone-500 truncate max-w-[150px]">
                    {document.file_name}
                  </span>
                )}
              </div>

              {document.file_url ? (
                isImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 group">
                    <img
                      src={document.file_url}
                      alt={document.name}
                      className="w-full max-h-64 object-contain mx-auto bg-stone-900/5 cursor-pointer"
                      onClick={() => setIsZoomed(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsZoomed(true)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition flex items-center gap-1 text-xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </button>
                  </div>
                ) : isPdf ? (
                  <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-2">
                    <iframe
                      src={document.file_url}
                      title={document.name}
                      className="w-full h-64 rounded-xl border border-stone-200"
                    />
                    <div className="mt-2 text-center">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#223326] underline hover:text-[#2c4031]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open PDF in new tab</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <FileText className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                    <p className="text-xs font-bold text-stone-700">{document.file_name}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Click download below to view this file</p>
                  </div>
                )
              ) : (
                <div className="p-5 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-stone-400">
                  <FileText className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-stone-500" />
                  <p className="text-xs font-medium text-stone-600">No file attached</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Tap &quot;Edit&quot; to upload a scan or document file.
                  </p>
                </div>
              )}
            </div>

            {/* Created Timestamp */}
            <div className="text-[11px] text-stone-400 flex items-center gap-1 pt-1">
              <Calendar className="w-3 h-3" />
              <span>Added on {new Date(document.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons: Download, Edit, Delete */}
          <div className="flex gap-2 pt-3 border-t border-stone-100 flex-shrink-0">
            {document.file_url && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(document);
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition active:scale-95 flex-shrink-0"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-stone-900">Delete Document?</h4>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete &quot;{document.name}&quot;? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Zoom Modal */}
      {isZoomed && document.file_url && (
        <div
          className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={document.file_url}
            alt={document.name}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
