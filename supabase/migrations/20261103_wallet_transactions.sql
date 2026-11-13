-- =========================================================================
-- Migration: 20261103_wallet_transactions.sql
-- Description: Creates transactions and scheduled_transactions tables with RLS
-- =========================================================================

-- 1. Create Enums for Transactions & Scheduled Payments
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('pay', 'receive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_frequency AS ENUM ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'processed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    recipient TEXT NOT NULL,
    category TEXT,
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Scheduled Transactions Table
CREATE TABLE IF NOT EXISTS public.scheduled_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    recipient TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    note TEXT,
    scheduled_date DATE NOT NULL,
    frequency transaction_frequency NOT NULL DEFAULT 'once',
    status transaction_status NOT NULL DEFAULT 'pending',
    last_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. High-Performance Indices
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_scheduled_txs_user_date ON public.scheduled_transactions(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_txs_status ON public.scheduled_transactions(status);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies for transactions
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 7. Row Level Security Policies for scheduled_transactions
CREATE POLICY "Users can view their own scheduled transactions"
    ON public.scheduled_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled transactions"
    ON public.scheduled_transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled transactions"
    ON public.scheduled_transactions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled transactions"
    ON public.scheduled_transactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 8. Updated_at Trigger for scheduled_transactions
CREATE OR REPLACE FUNCTION public.handle_scheduled_txs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scheduled_txs_updated_at ON public.scheduled_transactions;
CREATE TRIGGER trg_scheduled_txs_updated_at
    BEFORE UPDATE ON public.scheduled_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_scheduled_txs_updated_at();
