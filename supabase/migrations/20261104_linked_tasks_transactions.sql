-- =========================================================================
-- Migration: 20261104_linked_tasks_transactions.sql
-- Description: Supports bidirectional two-way references between tasks and scheduled transactions
-- =========================================================================

-- 1. Link scheduled transactions to tasks
ALTER TABLE public.scheduled_transactions 
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- 2. Link tasks to scheduled transactions
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS linked_transaction_id UUID REFERENCES public.scheduled_transactions(id) ON DELETE SET NULL;

-- 3. Update transaction_status enum to include 'paid' if not already present
DO $$ BEGIN
    ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'paid';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Indices for efficient foreign key lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_txs_linked_task ON public.scheduled_transactions(linked_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_linked_tx ON public.tasks(linked_transaction_id);
