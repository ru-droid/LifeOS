import React from 'react';
import { FileText, FileImage, Paperclip, ChevronRight, Hash } from 'lucide-react';
import { UserDocument } from '../../types/database';

interface DocumentCardProps {
  document: UserDocument;
  onClick: (doc: UserDocument) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick }) => {
  // Filter custom fields marked to be shown on card
  const visibleCardFields = (document.custom_fields || []).filter((f) => f.show_on_card && f.value?.trim());

  const isPdf = document.file_type === 'application/pdf' || document.file_name?.toLowerCase().endsWith('.pdf');
  const isImage = document.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(document.file_name || '');

  return (
    <div
      onClick={() => onClick(document)}
      className="bg-white rounded-[22px] p-4 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-stone-300 transition-all active:scale-[0.99] group"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Icon */}
        <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 flex-shrink-0 group-hover:bg-[#223326]/10 group-hover:text-[#223326] transition">
          {isImage ? (
            <FileImage className="w-5 h-5 stroke-[2]" />
          ) : (
            <FileText className="w-5 h-5 stroke-[2]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-stone-900 tracking-tight truncate leading-snug">
              {document.name}
            </h3>

            {document.file_url || document.file_name ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                <Paperclip className="w-2.5 h-2.5" />
                {isPdf ? 'PDF' : isImage ? 'IMG' : 'FILE'}
              </span>
            ) : null}
          </div>

          {/* Optional Document Number (if present) */}
          {document.doc_number && (
            <div className="flex items-center gap-1 text-xs text-stone-500 font-mono mt-0.5">
              <Hash className="w-3 h-3 text-stone-400" />
              <span className="truncate">{document.doc_number}</span>
            </div>
          )}

          {/* Custom Fields marked with show_on_card: true */}
          {visibleCardFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {visibleCardFields.map((field) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100/90 border border-stone-200/60 text-[11px] font-medium text-stone-700"
                >
                  <span className="text-stone-400 font-semibold">{field.label}:</span>
                  <span className="font-bold text-stone-800">{field.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <div className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
