
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS winnings_balance NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_fees NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  tax_fee NUMERIC NOT NULL,
  agent_fee NUMERIC NOT NULL,
  tax_paid BOOLEAN NOT NULL DEFAULT false,
  agent_paid BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'awaiting_tax',
  mpesa_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users create own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users update own withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins view all withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins manage withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when a bet flips to "won", credit winnings_balance
CREATE OR REPLACE FUNCTION public.track_winnings_on_bet_win()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'won' AND COALESCE(OLD.status, '') <> 'won' THEN
    UPDATE public.profiles
      SET winnings_balance = winnings_balance + COALESCE(NEW.potential_win, 0)
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bets_track_winnings ON public.bets;
CREATE TRIGGER bets_track_winnings
AFTER UPDATE ON public.bets
FOR EACH ROW EXECUTE FUNCTION public.track_winnings_on_bet_win();
