import React, { useState } from 'react';
import {
  Inbox,
  Clock,
  Archive,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
} from 'lucide-react';
import { Task, PriorityTier } from '../types/database';

interface InboxViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onUpdateTaskTier: (id: string, tier: PriorityTier) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string, tier: PriorityTier) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  tasks,
  onToggleTask,
  onUpdateTaskTier,
  onDeleteTask,
  onAddTask,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'someday' | 'upcoming'>('someday');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');

  // Filter tasks
  const somedayTasks = tasks.filter((t) => t.priority_tier === 'someday');
  const upcomingTasks = tasks.filter((t) => t.priority_tier === 'upcoming');

  const currentList = activeSubTab === 'someday' ? somedayTasks : upcomingTasks;
  const filteredList = currentList.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onAddTask(quickInput.trim(), activeSubTab);
    setQuickInput('');
  };

  return (
    <div className="space-y-4 px-5 pt-5 pb-24 bg-[#f6f4ee] min-h-full text-stone-900">
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <span>Task Backlog</span>
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Store ideas and upcoming tasks. Tap "Do Today" to promote to your focus list.
        </p>
      </div>

      {/* Sub Tabs: Someday vs Upcoming */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/70 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('someday')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'someday'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Later / Ideas ({somedayTasks.filter((t) => !t.is_completed).length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'upcoming'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>This Week ({upcomingTasks.filter((t) => !t.is_completed).length})</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeSubTab === 'someday' ? 'ideas & later tasks' : 'this week tasks'}...`}
          className="w-full bg-white border border-stone-200 focus:border-[#223326] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2 text-xs text-stone-400 hover:text-stone-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-stone-200/70 space-y-2 shadow-xs">
            <Inbox className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">
              {searchQuery ? 'No matching items found.' : `No items in ${activeSubTab === 'someday' ? 'Later' : 'This Week'}.`}
            </p>
            <p className="text-xs text-stone-500">
              {activeSubTab === 'someday'
                ? 'Save future ideas, wishlist projects, or notes here.'
                : 'Tasks you want to tackle later this week.'}
            </p>
          </div>
        ) : (
          filteredList.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                task.is_completed
                  ? 'bg-stone-100 border-stone-200 opacity-60'
                  : 'bg-white border-stone-200/70 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                {/* Complete Toggle */}
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-stone-400 hover:text-stone-800 transition"
                  title={task.is_completed ? 'Mark incomplete' : 'Mark completed'}
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium ${
                      task.is_completed ? 'line-through text-stone-400' : 'text-stone-900'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[10px] text-stone-400">
                    Created {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Single Tap Action: MOVE TO TODAY */}
                  <button
                    onClick={() => onUpdateTaskTier(task.id, 'today')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#223326] text-white text-xs font-semibold hover:bg-[#2b4030] transition active:scale-95 shadow-xs"
                    title="Promote to Today"
                  >
                    <span>Do Today</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Switch between Someday and Upcoming */}
                  {activeSubTab === 'someday' ? (
                    <button
                      onClick={() => onUpdateTaskTier(task.id, 'upcoming')}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                      title="Move to This Week"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateTaskTier(task.id, 'someday')}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                      title="Move to Later"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Add at bottom */}
      <form onSubmit={handleQuickAdd} className="flex gap-2 pt-2">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={`+ Add a task to ${activeSubTab === 'someday' ? 'Later' : 'This Week'}...`}
          className="flex-1 bg-white border border-stone-200 focus:border-[#223326] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition shadow-xs"
        />
        <button
          type="submit"
          disabled={!quickInput.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#223326] hover:bg-[#2b4030] text-white font-semibold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Add
        </button>
      </form>
    </div>
  );
};
