import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  X,
  Check,
  Trash2,
  Share2,
  Calendar,
  Sparkles,
  ChevronRight,
  Clock,
  Repeat,
  CheckCircle2,
  CalendarClock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storage, getIsoDate } from '../lib/storage';
import {
  WalletTransaction,
  BillSplit,
  SplitParticipant,
  ScheduledTransaction,
  TransactionFrequency,
} from '../types/database';

export const WalletView: React.FC = () => {
  const [balance, setBalance] = useState<number>(storage.getWalletBalance());
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(storage.isBalanceVisible());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(storage.getWalletTransactions());
  const [scheduledTxs, setScheduledTxs] = useState<ScheduledTransaction[]>(storage.getScheduledTransactions());
  const [splits, setSplits] = useState<BillSplit[]>(storage.getSplits());

  // Balance Edit Modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState('');

  // Pay Modal (Quick Pay vs Schedule Payment)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMode, setPayMode] = useState<'quick' | 'schedule'>('quick');
  const [payAmount, setPayAmount] = useState('');
  const [payTo, setPayTo] = useState('');
  // Blank Default Category: no pre-selected value by default
  const [payCategory, setPayCategory] = useState('');
  const [payNote, setPayNote] = useState('');

  // Schedule fields
  const [scheduleDate, setScheduleDate] = useState(getIsoDate());
  const [scheduleFrequency, setScheduleFrequency] = useState<TransactionFrequency>('monthly');

  // Receive Modal
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveFrom, setReceiveFrom] = useState('');
  const [receiveDesc, setReceiveDesc] = useState('');

  // Split Creation Modal
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitTitle, setSplitTitle] = useState('');
  const [splitTotal, setSplitTotal] = useState('');
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(3);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<{ id: string; name: string; amount: number }[]>([
    { id: 'p1', name: 'You', amount: 0 },
    { id: 'p2', name: 'Friend 1', amount: 0 },
    { id: 'p3', name: 'Friend 2', amount: 0 },
  ]);

  // Edit Scheduled Payment Modal
  const [editingScheduled, setEditingScheduled] = useState<ScheduledTransaction | null>(null);
  const [editSchAmount, setEditSchAmount] = useState('');
  const [editSchRecipient, setEditSchRecipient] = useState('');
  const [editSchCategory, setEditSchCategory] = useState('');
  const [editSchDate, setEditSchDate] = useState('');
  const [editSchFrequency, setEditSchFrequency] = useState<TransactionFrequency>('once');
  const [editSchNote, setEditSchNote] = useState('');

  // Edit Split Contribution Modal
  const [editingSplit, setEditingSplit] = useState<BillSplit | null>(null);
  const [editSplitTitle, setEditSplitTitle] = useState('');
  const [editSplitTotal, setEditSplitTotal] = useState('');
  const [editSplitMode, setEditSplitMode] = useState<'equal' | 'custom'>('equal');
  const [editSplitParticipants, setEditSplitParticipants] = useState<SplitParticipant[]>([]);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'transactions' | 'scheduled' | 'splits'>('all');

  const refreshState = () => {
    setBalance(storage.getWalletBalance());
    setIsBalanceVisible(storage.isBalanceVisible());
    setTransactions(storage.getWalletTransactions());
    setScheduledTxs(storage.getScheduledTransactions());
    setSplits(storage.getSplits());
  };

  useEffect(() => {
    const unsub = storage.subscribe(refreshState);
    return () => unsub();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Balance Visibility Toggle
  const handleToggleBalanceVisibility = () => {
    const next = !isBalanceVisible;
    setIsBalanceVisible(next);
    storage.setBalanceVisible(next);
  };

  // Save Balance
  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBalanceInput);
    if (!isNaN(val) && val >= 0) {
      storage.setWalletBalance(val);
      setShowBalanceModal(false);
      setNewBalanceInput('');
      showNotification('Wallet balance updated');
    }
  };

  // Pay Modal Submission (Option 1: Quick Pay vs Option 2: Schedule Payment)
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0 || !payTo.trim()) return;

    const chosenCat = payCategory.trim() || 'General';

    if (payMode === 'quick') {
      // Option 1: Quick Pay (Instant Payment)
      // Deducts from balance, appends to transaction history, pushes update to Today's Focus/Hub view
      storage.addWalletTransaction({
        type: 'pay',
        amount: amt,
        description: payNote.trim() || `${chosenCat} payment to ${payTo.trim()}`,
        person: payTo.trim(),
        category: chosenCat,
        date: getIsoDate(),
      });

      try {
        confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });
      } catch {}

      showNotification(`Paid ₹${amt.toLocaleString()} to ${payTo.trim()}`);
    } else {
      // Option 2: Schedule Payment
      // Saves to scheduled_transactions, updates Today's Focus with upcoming payment reminder badge
      storage.addScheduledTransaction({
        amount: amt,
        recipient: payTo.trim(),
        category: chosenCat,
        note: payNote.trim() || null,
        scheduled_date: scheduleDate,
        frequency: scheduleFrequency,
      });

      showNotification(`Payment of ₹${amt.toLocaleString()} scheduled for ${scheduleDate}`);
    }

    // Reset form
    setPayAmount('');
    setPayTo('');
    setPayCategory('');
    setPayNote('');
    setShowPayModal(false);
  };

  // Open Edit Scheduled Payment Modal
  const handleOpenEditScheduled = (sch: ScheduledTransaction) => {
    setEditingScheduled(sch);
    setEditSchAmount(sch.amount.toString());
    setEditSchRecipient(sch.recipient);
    setEditSchCategory(sch.category);
    setEditSchDate(sch.scheduled_date);
    setEditSchFrequency(sch.frequency);
    setEditSchNote(sch.note || '');
  };

  // Save Edit Scheduled Payment
  const handleSaveEditScheduled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduled) return;
    const amt = parseFloat(editSchAmount);
    if (isNaN(amt) || amt <= 0 || !editSchRecipient.trim()) return;

    storage.updateScheduledTransaction(editingScheduled.id, {
      amount: amt,
      recipient: editSchRecipient.trim(),
      category: editSchCategory.trim() || 'General',
      scheduled_date: editSchDate,
      frequency: editSchFrequency,
      note: editSchNote.trim() || null,
    });

    setEditingScheduled(null);
    showNotification('Scheduled payment updated');
  };

  // Receive Submission
  const handleSaveReceive = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(receiveAmount);
    if (isNaN(amt) || amt <= 0 || !receiveFrom.trim()) return;

    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    } catch {}

    storage.addWalletTransaction({
      type: 'receive',
      amount: amt,
      description: receiveDesc.trim() || `Received from ${receiveFrom.trim()}`,
      person: receiveFrom.trim(),
    });

    setReceiveAmount('');
    setReceiveFrom('');
    setReceiveDesc('');
    setShowReceiveModal(false);
    showNotification(`Received ₹${amt.toLocaleString()} from ${receiveFrom.trim()}`);
  };

  // Instant trigger for a scheduled payment (Pay Now)
  // Two-way sync: executes payment, updates status to 'paid', locates linked task in Today's Focus and marks completed
  const handleTriggerScheduledPayment = (sch: ScheduledTransaction) => {
    storage.processScheduledTransaction(sch.id);
    showNotification(`Processed ₹${sch.amount.toLocaleString()} for ${sch.recipient}`);
    try {
      confetti({ particleCount: 25, spread: 55, origin: { y: 0.6 } });
    } catch {}
  };

  // Open Edit Split Contribution Modal
  const handleOpenEditSplit = (split: BillSplit) => {
    setEditingSplit(split);
    setEditSplitTitle(split.title);
    setEditSplitTotal(split.total_amount.toString());
    setEditSplitMode(split.split_type);
    setEditSplitParticipants(split.participants.map((p) => ({ ...p })));
  };

  // Save Edit Split Contribution
  const handleSaveEditSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSplit) return;
    const total = parseFloat(editSplitTotal) || 0;
    if (total <= 0) return;

    storage.updateSplit(editingSplit.id, {
      title: editSplitTitle.trim() || 'Shared Contribution',
      total_amount: total,
      people_count: editSplitParticipants.length,
      split_type: editSplitMode,
      participants: editSplitParticipants,
    });

    setEditingSplit(null);
    showNotification('Split contribution updated');
  };

  // Quick toggle participant payment status on card
  const handleToggleParticipantPaidOnCard = (splitId: string, participantId: string) => {
    storage.toggleSplitParticipantPaid(splitId, participantId);
  };

  // People count change for split creation
  const handlePeopleCountChange = (newCount: number) => {
    const clamped = Math.max(2, Math.min(15, newCount));
    setSplitPeopleCount(clamped);

    setParticipants((prev) => {
      const next = [...prev];
      if (clamped > next.length) {
        for (let i = next.length + 1; i <= clamped; i++) {
          next.push({ id: `p_${Date.now()}_${i}`, name: `Person ${i}`, amount: 0 });
        }
      } else {
        next.splice(clamped);
      }
      return next;
    });
  };

  const handleParticipantNameChange = (index: number, newName: string) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleParticipantAmountChange = (index: number, newAmount: number) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], amount: Math.max(0, newAmount) };
      return next;
    });
  };

  const totalSplitNum = parseFloat(splitTotal) || 0;
  const equalShare = totalSplitNum > 0 && splitPeopleCount > 0 ? totalSplitNum / splitPeopleCount : 0;
  const customAllocatedSum = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
  const customDifference = totalSplitNum - customAllocatedSum;

  const handleSaveSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSplitNum <= 0) return;

    const finalParticipants: SplitParticipant[] = participants.map((p) => ({
      id: p.id,
      name: p.name.trim() || 'Anonymous',
      amount: splitMode === 'equal' ? Number(equalShare.toFixed(2)) : p.amount || 0,
      paid: p.name.toLowerCase() === 'you',
    }));

    storage.addSplit({
      title: splitTitle.trim() || 'Shared Contribution',
      total_amount: totalSplitNum,
      people_count: splitPeopleCount,
      split_type: splitMode,
      participants: finalParticipants,
    });

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {}

    setShowSplitModal(false);
    setSplitTotal('');
    setSplitTitle('');
    showNotification('Group contribution split created');
  };

  const handleCopySplitSummary = (split: BillSplit) => {
    const lines = [
      `💸 Split: ${split.title} (Total: ₹${split.total_amount.toLocaleString()})`,
      ...split.participants.map(
        (p) => `• ${p.name}: ₹${p.amount.toLocaleString()} ${p.paid ? '(Paid)' : '(Pending)'}`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback(split.id);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Stats calculation
  const totalPaid = transactions
    .filter((t) => t.type === 'pay')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'receive')
    .reduce((sum, t) => sum + t.amount, 0);

  const quickCategories = ['Groceries', 'Dining', 'Bills', 'Shopping', 'Transport', 'Health', 'Other'];
  const scheduleCategories = ['Subscriptions', 'Rent & Housing', 'Utilities', 'Investments / SIP', 'EMI / Loan', 'Insurance', 'General'];
  const frequencies: { id: TransactionFrequency; label: string }[] = [
    { id: 'once', label: 'Once' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="min-h-full bg-[#f6f4ee] text-stone-900 px-5 pt-4 pb-24 font-sans select-none antialiased">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#223326] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* =========================================================================
          1. BALANCE CARD & VISIBILITY TOGGLE
          - Default State: Hides monetary balance display by default (render ••••••)
          - Toggle Icon: Eye / EyeOff placed directly next to the Edit button
          - Persists locally
         ========================================================================= */}
      <div className="bg-white rounded-[26px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 mb-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase flex items-center gap-1.5">
              <span>Total Balance</span>
              <span className="text-[10px] text-stone-400 font-normal">
                {isBalanceVisible ? '(Visible)' : '(Protected)'}
              </span>
            </div>

            <div className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1 flex items-baseline gap-1">
              <span>₹</span>
              {isBalanceVisible ? (
                <span className="tabular-nums transition-all duration-200">
                  {balance.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="tracking-widest text-stone-400 text-2xl font-mono select-none">
                  ••••••
                </span>
              )}
            </div>
          </div>

          {/* Action Button Row: Eye Toggle directly next to Edit Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBalanceVisibility}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer"
              title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
              aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {isBalanceVisible ? (
                <EyeOff className="w-4 h-4 text-stone-700" />
              ) : (
                <Eye className="w-4 h-4 text-stone-700" />
              )}
            </button>

            <button
              onClick={() => {
                setNewBalanceInput(balance.toString());
                setShowBalanceModal(true);
              }}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer"
              title="Update balance"
              aria-label="Update balance"
            >
              <Pencil className="w-4 h-4 text-stone-700" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. PAY & RECEIVE CARDS (WALLET TAB)
          - Removed colored, repeated words "Pay +" and "Receive +" from card bodies
          - Clean, ultra-compact, stripped of duplicate textual labels
         ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {/* PAY CARD */}
        <div
          onClick={() => {
            setPayMode('quick');
            setPayCategory('');
            setShowPayModal(true);
          }}
          className="bg-white rounded-[22px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-rose-200 transition active:scale-[0.99] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowUpRight className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="text-xs font-bold text-stone-800">Pay</span>
            </div>

            {/* Clean, compact plus icon button without redundant text */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPayMode('quick');
                setPayCategory('');
                setShowPayModal(true);
              }}
              className="w-6 h-6 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
              title="Add payment"
              aria-label="Add payment"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
            </button>
          </div>

          <div className="text-lg font-extrabold text-stone-900 tracking-tight">
            ₹{totalPaid.toLocaleString()}
          </div>
        </div>

        {/* RECEIVE CARD */}
        <div
          onClick={() => setShowReceiveModal(true)}
          className="bg-white rounded-[22px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-emerald-200 transition active:scale-[0.99] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="text-xs font-bold text-stone-800">Receive</span>
            </div>

            {/* Clean, compact plus icon button without redundant text */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReceiveModal(true);
              }}
              className="w-6 h-6 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
              title="Add receive"
              aria-label="Add receive"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
            </button>
          </div>

          <div className="text-lg font-extrabold text-stone-900 tracking-tight">
            ₹{totalReceived.toLocaleString()}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SPLIT AMOUNT CARD
          - Completely removed "Equal/custom" label from the header/card
         ========================================================================= */}
      <div
        onClick={() => setShowSplitModal(true)}
        className="bg-white rounded-[22px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-stone-300 transition active:scale-[0.99] mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#223326]/10 flex items-center justify-center text-[#223326]">
              <Users className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 tracking-tight">
                Split amount
              </div>
              <div className="text-[11px] text-stone-500">
                Calculate & manage group contributions
              </div>
            </div>
          </div>

          {/* Clean right indicator: ONLY ChevronRight, zero "Equal/custom" badge */}
          <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. TRANSACTION & ACTIVITY SECTION
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Transactions & Activity
          </h2>
          <div className="flex gap-1 text-[11px] font-semibold bg-stone-200/70 p-0.5 rounded-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-0.5 rounded-lg transition ${
                activeFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('transactions')}
              className={`px-2.5 py-0.5 rounded-lg transition ${
                activeFilter === 'transactions' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              Txns
            </button>
            <button
              onClick={() => setActiveFilter('scheduled')}
              className={`px-2.5 py-0.5 rounded-lg transition flex items-center gap-1 ${
                activeFilter === 'scheduled' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              Scheduled
              {scheduledTxs.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => setActiveFilter('splits')}
              className={`px-2.5 py-0.5 rounded-lg transition ${
                activeFilter === 'splits' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              Splits
            </button>
          </div>
        </div>

        {/* =========================================================================
            UPCOMING SCHEDULED PAYMENT CARDS
            - Uniform Action Buttons: Fixed to exact w-24 h-9 dimensions with centered text
            - Payment State Transition: When tapped, button is replaced with static "Paid" indicator
            - Edit Functionality: Pencil icon button to edit amount, recipient, category, date, recurrence
           ========================================================================= */}
        {(activeFilter === 'all' || activeFilter === 'scheduled') && scheduledTxs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-amber-900/80 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                <span>Upcoming Scheduled Payments</span>
              </span>
              <button
                onClick={() => {
                  setPayMode('schedule');
                  setPayCategory('');
                  setShowPayModal(true);
                }}
                className="text-[10px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-0.5"
              >
                + Schedule new
              </button>
            </div>

            <div className="space-y-2">
              {scheduledTxs.map((sch) => {
                const isDueToday = sch.scheduled_date === getIsoDate();
                const isPaid = sch.status === 'paid';
                return (
                  <div
                    key={sch.id}
                    className={`bg-white rounded-[20px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border transition ${
                      isPaid
                        ? 'border-emerald-200/70 bg-emerald-50/15'
                        : isDueToday
                        ? 'border-amber-400/80 bg-amber-50/20'
                        : 'border-stone-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isPaid ? (
                            <Check className="w-4 h-4 stroke-[2.4]" />
                          ) : (
                            <Clock className="w-4 h-4 stroke-[2.2]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900 truncate">
                              {sch.recipient}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                              {sch.frequency}
                            </span>
                            {isDueToday && !isPaid && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 animate-pulse">
                                Due Today
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1 truncate">
                            <span>{sch.category}</span>
                            <span>·</span>
                            <span>{isPaid ? 'Paid on' : 'Next'}: {sch.scheduled_date}</span>
                            {sch.note && <span>· {sch.note}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-stone-900">
                            ₹{sch.amount.toLocaleString()}
                          </div>
                        </div>

                        {/* Uniform Action Button: Exact w-24 h-9 dimensions with centered text.
                            State transition: when paid, renders static "Paid" indicator */}
                        {isPaid ? (
                          <div
                            className="w-24 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200/60 shadow-2xs select-none"
                            title="Payment Completed"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.4]" />
                            <span>Paid</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTriggerScheduledPayment(sch)}
                            className="w-24 h-9 rounded-xl bg-[#223326] hover:bg-[#2c4031] text-white text-xs font-bold transition active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer"
                            title="Pay & Record Now"
                          >
                            Pay Now
                          </button>
                        )}

                        {/* Edit Button for Scheduled Payment */}
                        <button
                          onClick={() => handleOpenEditScheduled(sch)}
                          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition active:scale-90"
                          title="Edit scheduled payment"
                          aria-label="Edit scheduled payment"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => storage.deleteScheduledTransaction(sch.id)}
                          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition active:scale-90"
                          title="Delete scheduled payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TRANSACTIONS LIST */}
        {(activeFilter === 'all' || activeFilter === 'transactions') && transactions.length > 0 && (
          <div className="bg-white rounded-[22px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-stone-200/60 divide-y divide-stone-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'pay' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {tx.type === 'pay' ? (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 leading-snug">{tx.description}</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {tx.type === 'pay' ? `To: ${tx.person}` : `From: ${tx.person}`}
                      {tx.category ? ` · ${tx.category}` : ''} · {tx.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs font-extrabold ${
                      tx.type === 'pay' ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {tx.type === 'pay' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                  </div>
                  <button
                    onClick={() => storage.deleteWalletTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-500 rounded transition"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================================
            SPLITS HISTORY (WITH EDIT BUTTON & PARTICIPANT PAYMENT TOGGLE)
           ========================================================================= */}
        {(activeFilter === 'all' || activeFilter === 'splits') && splits.length > 0 && (
          <div className="space-y-2.5">
            {splits.map((split) => (
              <div
                key={split.id}
                className="bg-white rounded-[22px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-stone-200/60"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{split.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {split.people_count} ppl
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-stone-900 mr-1">
                      ₹{split.total_amount.toLocaleString()}
                    </span>

                    {/* Edit Split Button */}
                    <button
                      onClick={() => handleOpenEditSplit(split)}
                      className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition active:scale-90"
                      title="Edit split contribution"
                      aria-label="Edit split contribution"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopySplitSummary(split)}
                      className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition active:scale-90"
                      title="Copy split summary"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => storage.deleteSplit(split.id)}
                      className="w-7 h-7 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition active:scale-90"
                      title="Delete split"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {copyFeedback === split.id && (
                  <div className="mb-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                    Copied split summary to clipboard!
                  </div>
                )}

                {/* Participant breakdown with interactive paid toggle */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-stone-100">
                  {split.participants.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleToggleParticipantPaidOnCard(split.id, p.id)}
                      className={`rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs cursor-pointer border transition ${
                        p.paid
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-stone-50 border-stone-200/70 text-stone-700'
                      }`}
                      title={`Click to mark ${p.paid ? 'Pending' : 'Paid'}`}
                    >
                      <span className="font-medium truncate max-w-[70px]">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1 font-bold">
                        <span>₹{p.amount.toLocaleString()}</span>
                        {p.paid ? (
                          <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {transactions.length === 0 && scheduledTxs.length === 0 && splits.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No wallet activity yet.</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Make a Quick Pay, schedule a recurring bill, or split a contribution.
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: UPDATE BALANCE
         ========================================================================= */}
      {showBalanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowBalanceModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-stone-700" />
                <h3 className="text-base font-bold text-stone-900">Update Balance</h3>
              </div>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Current Wallet Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={newBalanceInput}
                    onChange={(e) => setNewBalanceInput(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-base font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[5000, 10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewBalanceInput(preset.toString())}
                    className="flex-1 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition"
                  >
                    ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] transition shadow-xs"
                >
                  Save Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PAYMENT MODAL (Quick Pay & Schedule Payment)
          - Blank Default Category: Category input/dropdown has NO pre-selected value by default
          - Clean placeholder "Select category"
         ========================================================================= */}
      {showPayModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowPayModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Make Payment</h3>
                  <p className="text-[11px] text-stone-500">Quick Pay or Schedule Recurring</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-2xl mt-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setPayMode('quick')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  payMode === 'quick'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Quick Pay (Instant)</span>
              </button>
              <button
                type="button"
                onClick={() => setPayMode('schedule')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  payMode === 'schedule'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Schedule Payment</span>
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="mt-4 space-y-3.5 overflow-y-auto flex-1 pr-1">
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-base font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Recipient (Paid To)
                </label>
                <input
                  type="text"
                  value={payTo}
                  onChange={(e) => setPayTo(e.target.value)}
                  placeholder={payMode === 'quick' ? 'e.g. Rahul, Supermarket, Cafe' : 'e.g. Landlord, Internet Provider, Gym'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              {/* Category Picker with Blank Default Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-600">
                    Category
                  </label>
                  {!payCategory && (
                    <span className="text-[10px] text-stone-400 font-medium">None selected</span>
                  )}
                </div>

                {/* Dropdown with blank default placeholder */}
                <select
                  value={payCategory}
                  onChange={(e) => setPayCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400 mb-2 cursor-pointer"
                >
                  <option value="">Select category</option>
                  {(payMode === 'quick' ? quickCategories : scheduleCategories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(payMode === 'quick' ? quickCategories : scheduleCategories).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPayCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        payCategory === cat
                          ? 'bg-[#223326] text-white shadow-2xs font-semibold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCHEDULE SPECIFIC CONTROLS */}
              {payMode === 'schedule' && (
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Date Picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        <span>Scheduled Date</span>
                      </label>
                      <input
                        type="date"
                        min={getIsoDate()}
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        required
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Frequency Picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-amber-700" />
                        <span>Repeat Frequency</span>
                      </label>
                      <select
                        value={scheduleFrequency}
                        onChange={(e) => setScheduleFrequency(e.target.value as TransactionFrequency)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-400"
                      >
                        {frequencies.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-800 flex items-center gap-1.5 leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>
                      Will create a synced payment reminder in Today&apos;s Focus.
                    </span>
                  </div>
                </div>
              )}

              {/* Optional Note / Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Note / Description (Optional)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Monthly rent, Shared internet bill"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!payAmount || !payTo.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition shadow-xs flex items-center justify-center gap-1.5 ${
                    payMode === 'quick' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#223326] hover:bg-[#2c4031]'
                  }`}
                >
                  {payMode === 'quick' ? 'Record Quick Pay' : 'Schedule Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT SCHEDULED PAYMENT MODAL
          - Edit all properties: amount, recipient, category, date, recurrence, note
         ========================================================================= */}
      {editingScheduled && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setEditingScheduled(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Edit Scheduled Payment</h3>
                  <p className="text-[11px] text-stone-500">Updates linked focus item and recurrence</p>
                </div>
              </div>
              <button
                onClick={() => setEditingScheduled(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditScheduled} className="mt-4 space-y-3.5 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={editSchAmount}
                    onChange={(e) => setEditSchAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-base font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  value={editSchRecipient}
                  onChange={(e) => setEditSchRecipient(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Category
                </label>
                <select
                  value={editSchCategory}
                  onChange={(e) => setEditSchCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                >
                  <option value="">Select category</option>
                  {scheduleCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={editSchDate}
                    onChange={(e) => setEditSchDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Recurrence
                  </label>
                  <select
                    value={editSchFrequency}
                    onChange={(e) => setEditSchFrequency(e.target.value as TransactionFrequency)}
                    className="w-full px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  >
                    {frequencies.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Note / Description (Optional)
                </label>
                <input
                  type="text"
                  value={editSchNote}
                  onChange={(e) => setEditSchNote(e.target.value)}
                  placeholder="e.g. Account number, contract note"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="flex gap-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingScheduled(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT SPLIT CONTRIBUTION MODAL
          - Edit person details, allocated split amounts, and payment status
         ========================================================================= */}
      {editingSplit && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setEditingSplit(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#223326]/10 text-[#223326] flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Edit Split Contribution</h3>
                  <p className="text-[11px] text-stone-500">Edit names, amounts, and payment status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSplit(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSplit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editSplitTotal}
                    onChange={(e) => setEditSplitTotal(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Event / Title
                  </label>
                  <input
                    type="text"
                    value={editSplitTitle}
                    onChange={(e) => setEditSplitTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Participants list with name, amount, and paid toggle */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-2">
                  Participants & Payment Status
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editSplitParticipants.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between gap-2"
                    >
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditSplitParticipants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                          );
                        }}
                        placeholder={`Person ${idx + 1}`}
                        className="flex-1 min-w-0 bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
                      />

                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={p.amount || ''}
                          onChange={(e) => {
                            const amt = parseFloat(e.target.value) || 0;
                            setEditSplitParticipants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: amt } : item))
                            );
                          }}
                          className="w-full pl-5 pr-2 py-1 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 text-right focus:outline-none"
                        />
                      </div>

                      {/* Payment Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditSplitParticipants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, paid: !item.paid } : item))
                          );
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                          p.paid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {p.paid ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Paid</span>
                          </>
                        ) : (
                          <span>Pending</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSplit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] transition shadow-xs"
                >
                  Save Split Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: ADD RECEIVE
         ========================================================================= */}
      {showReceiveModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowReceiveModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Add Received Money</h3>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReceive} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-base font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Received From (Sender)
                </label>
                <input
                  type="text"
                  value={receiveFrom}
                  onChange={(e) => setReceiveFrom(e.target.value)}
                  placeholder="e.g. Priya, Client Acme, Refund"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={receiveDesc}
                  onChange={(e) => setReceiveDesc(e.target.value)}
                  placeholder="e.g. Freelance invoice milestone, Dinner payback"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!receiveAmount || !receiveFrom.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-40 transition shadow-xs"
                >
                  Record Receive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: CREATE SPLIT CONTRIBUTION POPUP MODAL
         ========================================================================= */}
      {showSplitModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowSplitModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#223326]/10 text-[#223326] flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Split Amount</h3>
              </div>
              <button
                onClick={() => setShowSplitModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSplit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Total Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={splitTotal}
                      onChange={(e) => setSplitTotal(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      required
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Purpose / Event
                  </label>
                  <input
                    type="text"
                    value={splitTitle}
                    onChange={(e) => setSplitTitle(e.target.value)}
                    placeholder="e.g. Dinner, Fuel, Gift"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Number of People */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Number of People
                </label>
                <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-stone-500" />
                    <span className="text-xs font-bold text-stone-800">
                      {splitPeopleCount} Participants
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePeopleCountChange(splitPeopleCount - 1)}
                      disabled={splitPeopleCount <= 2}
                      className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 disabled:opacity-40 text-stone-700 font-bold text-sm flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-stone-800">
                      {splitPeopleCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePeopleCountChange(splitPeopleCount + 1)}
                      disabled={splitPeopleCount >= 15}
                      className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 disabled:opacity-40 text-stone-700 font-bold text-sm flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Split Mode: Equal Ratio vs Custom Split */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Split Method
                </label>
                <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSplitMode('equal')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      splitMode === 'equal'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Equal Ratio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMode('custom');
                      const initialPerPerson = totalSplitNum > 0 ? totalSplitNum / splitPeopleCount : 0;
                      setParticipants((prev) =>
                        prev.map((p) => ({
                          ...p,
                          amount: p.amount || Number(initialPerPerson.toFixed(2)),
                        }))
                      );
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      splitMode === 'custom'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Custom Split
                  </button>
                </div>
              </div>

              {/* Participants & Name Inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-600">
                    Participant Names {splitMode === 'custom' && '& Share'}
                  </label>
                  {splitMode === 'equal' && totalSplitNum > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700">
                      ₹{equalShare.toFixed(2)} each
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {participants.map((person, index) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200/80"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => handleParticipantNameChange(index, e.target.value)}
                        placeholder={`Person ${index + 1}`}
                        className="flex-1 min-w-0 bg-transparent text-xs font-medium text-stone-800 focus:outline-none"
                      />

                      {splitMode === 'equal' ? (
                        <span className="text-xs font-bold text-stone-700 px-2 flex-shrink-0">
                          ₹{equalShare.toFixed(2)}
                        </span>
                      ) : (
                        <div className="relative w-24 flex-shrink-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-[11px]">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={person.amount || ''}
                            onChange={(e) =>
                              handleParticipantAmountChange(index, parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-full pl-5 pr-2 py-1 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-400 text-right"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Split Balance Validation Status */}
              {splitMode === 'custom' && totalSplitNum > 0 && (
                <div
                  className={`text-xs p-2 rounded-xl flex items-center justify-between font-semibold ${
                    Math.abs(customDifference) < 0.1
                      ? 'bg-emerald-50 text-emerald-800'
                      : customDifference > 0
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  <span>
                    Allocated: ₹{customAllocatedSum.toFixed(2)} / ₹{totalSplitNum.toFixed(2)}
                  </span>
                  <span>
                    {Math.abs(customDifference) < 0.1
                      ? '✓ Matched'
                      : customDifference > 0
                      ? `₹${customDifference.toFixed(2)} left`
                      : `₹${Math.abs(customDifference).toFixed(2)} over`}
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !splitTotal ||
                    totalSplitNum <= 0 ||
                    (splitMode === 'custom' && Math.abs(customDifference) > 0.5)
                  }
                  className="flex-1 py-2.5 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2c4031] disabled:opacity-40 transition shadow-xs"
                >
                  Save Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
