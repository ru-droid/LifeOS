import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock, DollarSign, Target, CheckCircle2, Circle } from 'lucide-react';
import { storage } from '../lib/storage';
import { DayEvent, Expense, Goal, Note } from '../types/database';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: DayEvent[];
  onRefresh: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, events, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00 AM');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    storage.addEvent(title.trim(), time);
    setTitle('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    storage.deleteEvent(id);
    onRefresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#faf8f5] text-stone-800 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center text-stone-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">My Day · Schedule</h3>
              <p className="text-xs text-stone-500">Keep track of meetings & appointments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Event Form */}
        <form onSubmit={handleAdd} className="my-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dentist check-up, Team sync..."
              className="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 shadow-xs"
            />
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-28 bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 text-center shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2 px-4 rounded-xl bg-[#223326] text-white text-xs font-semibold hover:bg-[#2b4030] disabled:opacity-40 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </form>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {events.length === 0 ? (
            <div className="py-8 text-center text-stone-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No schedule events yet</p>
              <p className="text-xs mt-0.5">Add your key events for today above.</p>
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/70 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                    {evt.time}
                  </span>
                  <span className="text-sm font-medium text-stone-800">{evt.title}</span>
                </div>
                <button
                  onClick={() => handleDelete(evt.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onRefresh: () => void;
}

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ isOpen, onClose, expenses, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const total = storage.getMonthlySpending();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    storage.addExpense(title.trim(), parsedAmount);
    setTitle('');
    setAmount('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    storage.deleteExpense(id);
    onRefresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#faf8f5] text-stone-800 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center text-stone-700">
              <span className="font-bold text-sm">₹</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Monthly Spending</h3>
              <p className="text-xs text-stone-500">Track day-to-day purchases & bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Total Card */}
        <div className="mt-4 p-4 rounded-2xl bg-white border border-stone-200/80 text-center shadow-xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total This Month</span>
          <div className="text-3xl font-extrabold text-stone-900 mt-1">₹{total.toLocaleString()}</div>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAdd} className="my-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Groceries, Coffee, Uber..."
              className="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 shadow-xs"
            />
            <div className="relative w-28">
              <span className="absolute left-3 top-2 text-stone-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-white border border-stone-300 rounded-xl pl-7 pr-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-500 shadow-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!title.trim() || !amount}
            className="w-full py-2 px-4 rounded-xl bg-[#223326] text-white text-xs font-semibold hover:bg-[#2b4030] disabled:opacity-40 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </form>

        {/* Expenses List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {expenses.length === 0 ? (
            <div className="py-6 text-center text-stone-400">
              <p className="text-sm font-medium">No expenses logged this month</p>
              <p className="text-xs mt-0.5">Quickly log purchases above.</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/70 shadow-xs"
              >
                <div>
                  <div className="text-sm font-medium text-stone-900">{exp.title}</div>
                  <div className="text-[11px] text-stone-400">{exp.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-stone-900">₹{exp.amount.toLocaleString()}</span>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1 text-stone-400 hover:text-rose-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onRefresh: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose, goals, onRefresh }) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    storage.addGoal(title.trim());
    setTitle('');
    onRefresh();
  };

  const handleToggle = (id: string) => {
    storage.toggleGoal(id);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    storage.deleteGoal(id);
    onRefresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#faf8f5] text-stone-800 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-200/80 flex items-center justify-center text-stone-700">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Goals & Milestones</h3>
              <p className="text-xs text-stone-500">Long-term vision and personal targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Goal Form */}
        <form onSubmit={handleAdd} className="my-4 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Save $5,000, Run 5k, Read 10 books..."
            className="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 shadow-xs"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="py-2 px-4 rounded-xl bg-[#223326] text-white text-xs font-semibold hover:bg-[#2b4030] disabled:opacity-40 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Goals List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {goals.length === 0 ? (
            <div className="py-8 text-center text-stone-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No goals yet</p>
              <p className="text-xs mt-0.5">Write down your key ambitions above.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/70 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(goal.id)}
                    className="text-stone-400 hover:text-stone-700 transition"
                  >
                    {goal.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400" />
                    )}
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      goal.is_completed ? 'line-through text-stone-400' : 'text-stone-800'
                    }`}
                  >
                    {goal.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
