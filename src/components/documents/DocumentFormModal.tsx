import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  FileImage,
  Paperclip,
  Check,
  AlertCircle,
} from 'lucide-react';
import { UserDocument, DocumentCustomField } from '../../types/database';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    doc_number?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    custom_fields: DocumentCustomField[];
  }) => void;
  initialDocument?: UserDocument | null;
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDocument,
}) => {
  const [name, setName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [customFields, setCustomFields] = useState<DocumentCustomField[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialDocument) {
        setName(initialDocument.name);
        setDocNumber(initialDocument.doc_number || '');
        setCustomFields(
          initialDocument.custom_fields ? JSON.parse(JSON.stringify(initialDocument.custom_fields)) : []
        );
        setFileName(initialDocument.file_name || null);
        setFileType(initialDocument.file_type || null);
        setFileUrl(initialDocument.file_url || null);
      } else {
        setName('');
        setDocNumber('');
        setCustomFields([]);
        setFileName(null);
        setFileType(null);
        setFileUrl(null);
      }
      setFileError(null);
    }
  }, [isOpen, initialDocument]);

  if (!isOpen) return null;

  // Custom Fields Handlers
  const handleAddField = () => {
    const newField: DocumentCustomField = {
      id: 'field_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      label: '',
      value: '',
      show_on_card: true,
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<DocumentCustomField>) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleRemoveField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // File Upload Handlers
  const processFile = (file: File) => {
    setFileError(null);

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileUrl(result);
      setFileName(file.name);
      setFileType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'));
    };
    reader.onerror = () => {
      setFileError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFileUrl(null);
    setFileName(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Filter out completely empty custom fields
    const cleanedFields = customFields
      .filter((f) => f.label.trim() || f.value.trim())
      .map((f) => ({
        ...f,
        label: f.label.trim() || 'Detail',
        value: f.value.trim(),
      }));

    onSubmit({
      name: name.trim(),
      doc_number: docNumber.trim() || null,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      custom_fields: cleanedFields,
    });

    onClose();
  };

  const isPdf = fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName || '');

  return (
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#223326]/10 text-[#223326] flex items-center justify-center">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {initialDocument ? 'Edit Document' : 'Add Document'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          {/* 1. Document Name (REQUIRED) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Document Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Passport, Driver's License, Rent Agreement"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:border-stone-500 transition"
            />
          </div>

          {/* 2. Document Number (OPTIONAL) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Document Number <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. ID, Policy, or Registration No."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-500 font-mono transition"
            />
          </div>

          {/* 3. File Upload (OPTIONAL) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              File Attachment <span className="text-stone-400 font-normal">(PDF or image, optional)</span>
            </label>

            {fileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center text-stone-700 flex-shrink-0">
                    {isPdf ? (
                      <FileText className="w-4 h-4 text-rose-600" />
                    ) : (
                      <FileImage className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">{fileName}</p>
                    <p className="text-[10px] text-stone-500 uppercase">{fileType || 'Attachment'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-200 transition"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#223326] bg-[#223326]/5'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                }`}
              >
                <UploadCloud className="w-6 h-6 mx-auto mb-1.5 text-stone-400" />
                <p className="text-xs font-bold text-stone-700">Tap to upload or drag file here</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Supports PDF, PNG, JPG, WebP up to 15MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* 4. Dynamic Custom Fields Section */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-stone-800">Custom Fields</span>
                <p className="text-[10px] text-stone-400">Add dates, tags, notes, or IDs</p>
              </div>
              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Field</span>
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">
                No custom fields added yet. Click &quot;Add Field&quot; to include custom details.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 animate-in fade-in duration-100"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        placeholder="Label (e.g. Expiry Date)"
                        className="w-1/2 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-400"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                        placeholder="Value (e.g. 2030-05-12)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition"
                        title="Remove field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-stone-600">
                      <input
                        type="checkbox"
                        checked={field.show_on_card}
                        onChange={(e) => handleUpdateField(field.id, { show_on_card: e.target.checked })}
                        className="rounded border-stone-300 text-[#223326] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-[#223326]"
                      />
                      <span>Show on card badge</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-3 border-t border-stone-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] disabled:opacity-40 transition shadow-xs"
            >
              {initialDocument ? 'Update Document' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
