import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CornerDownLeft,
  Calendar,
  Clock,
  Archive,
  CheckCircle2,
  Receipt,
  FileText,
  Plus,
} from 'lucide-react';
import { PriorityTier } from '../types/database';
import { storage } from '../lib/storage';

export type CaptureCategory = 'task' | 'expense' | 'note' | 'event';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, tier: PriorityTier, description?: string, due_time?: string) => void;
  defaultTier?: PriorityTier;
  initialCategory?: CaptureCategory;
  onCaptured?: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTier = 'today',
  initialCategory = 'task',
  onCaptured,
}) => {
  const [category, setCategory] = useState<CaptureCategory>(initialCategory);
  
  // Task fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [tier, setTier] = useState<PriorityTier>(defaultTier);

  // Expense fields
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Note fields
  const [noteContent, setNoteContent] = useState('');

  // Event fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('10:00 AM');

  const inputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setTier(defaultTier);
      setTaskTitle('');
      setTaskDescription('');
      setExpenseTitle('');
      setExpenseAmount('');
      setNoteContent('');
      setEventTitle('');
      setEventTime('10:00 AM');

      const timer = setTimeout(() => {
        if (category === 'note') {
          noteRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultTier, initialCategory]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (category === 'task') {
      if (!taskTitle.trim()) return;
      onSubmit(taskTitle.trim(), tier, taskDescription.trim() || undefined);
    } else if (category === 'expense') {
      const amount = parseFloat(expenseAmount);
      if (!expenseTitle.trim() || isNaN(amount) || amount <= 0) return;
      storage.addExpense(expenseTitle.trim(), amount);
    } else if (category === 'note') {
      if (!noteContent.trim()) return;
      storage.addNote(noteContent.trim());
    } else if (category === 'event') {
      if (!eventTitle.trim()) return;
      storage.addEvent(eventTitle.trim(), eventTime.trim() || '10:00 AM');
    }

    if (onCaptured) {
      onCaptured();
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || category !== 'note')) {
      if (e.target !== noteRef.current || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#faf8f5] text-stone-900 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative animate-in slide-in-from-bottom duration-200 border border-stone-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header with 4 Category Pills */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => setCategory('task')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                category === 'task'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => setCategory('expense')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                category === 'expense'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setCategory('note')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                category === 'note'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Note
            </button>
            <button
              type="button"
              onClick={() => setCategory('event')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                category === 'event'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Event
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/80 text-stone-500 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Form by Category */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TASK MODE */}
          {category === 'task' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Task name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Call dentist, Prepare slides..."
                  className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Priority Schedule
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTier('today')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      tier === 'today'
                        ? 'bg-[#223326] text-white border-[#223326] shadow-xs'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Today</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTier('upcoming')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      tier === 'upcoming'
                        ? 'bg-[#223326] text-white border-[#223326] shadow-xs'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>This Week</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTier('someday')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      tier === 'someday'
                        ? 'bg-[#223326] text-white border-[#223326] shadow-xs'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Later</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* EXPENSE MODE */}
          {category === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Expense item
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Morning coffee, Grocery run..."
                  className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="250"
                    className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl pl-8 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* NOTE MODE */}
          {category === 'note' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Quick Note or Thought
              </label>
              <textarea
                ref={noteRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Jot down a quick thought, book recommendation, or reminder..."
                rows={4}
                className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl p-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none resize-none shadow-xs"
              />
            </div>
          )}

          {/* EVENT MODE */}
          {category === 'event' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Event name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Product Demo with Team..."
                  className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Time
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="10:30 AM"
                  className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-xs"
                />
              </div>
            </>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-500">
              Press <kbd className="bg-stone-200 px-1.5 py-0.5 rounded text-stone-700 text-[10px]">Enter</kbd> to save
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-200/70 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#223326] hover:bg-[#2b4030] text-white text-xs font-bold shadow-md shadow-stone-800/10 transition active:scale-95"
              >
                <span>Save</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FloatingActionButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-[#223326] text-white flex items-center justify-center shadow-lg shadow-stone-900/20 hover:bg-[#2b4030] active:scale-95 transition-transform"
      title="Capture anything (C)"
      aria-label="Capture anything"
    >
      <Plus className="w-6 h-6 stroke-[2.2]" />
    </button>
  );
};
