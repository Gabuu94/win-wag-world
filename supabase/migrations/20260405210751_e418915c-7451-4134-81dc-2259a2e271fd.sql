
-- VIP tiers reference table
CREATE TABLE public.vip_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_wagered NUMERIC NOT NULL DEFAULT 0,
  cashback_rate NUMERIC NOT NULL DEFAULT 0,
  bonus_multiplier NUMERIC NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT '🥉',
  color TEXT NOT NULL DEFAULT '#cd7f32'
);

-- Seed VIP tiers
INSERT INTO public.vip_tiers (name, min_wagered, cashback_rate, bonus_multiplier, icon, color) VALUES
  ('Bronze', 0, 0.5, 1, '🥉', '#cd7f32'),
  ('Silver', 500, 1, 1.1, '🥈', '#c0c0c0'),
  ('Gold', 2000, 2, 1.25, '🥇', '#ffd700'),
  ('Platinum', 10000, 3, 1.5, '💎', '#e5e4e2'),
  ('Diamond', 50000, 5, 2, '👑', '#b9f2ff');

-- Make VIP tiers readable by everyone
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view VIP tiers" ON public.vip_tiers FOR SELECT USING (true);

-- Add total_wagered to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_wagered NUMERIC NOT NULL DEFAULT 0;

-- Vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  max_uses INT NOT NULL DEFAULT 1,
  current_uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active vouchers" ON public.vouchers FOR SELECT USING (active = true);

-- Voucher redemptions
CREATE TABLE public.voucher_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id),
  amount NUMERIC NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions" ON public.voucher_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.voucher_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verification documents
CREATE TABLE public.verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own docs" ON public.verification_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit docs" ON public.verification_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get user VIP tier
CREATE OR REPLACE FUNCTION public.get_user_vip_tier(p_user_id UUID)
RETURNS TABLE(tier_name TEXT, tier_icon TEXT, tier_color TEXT, cashback_rate NUMERIC, bonus_multiplier NUMERIC, total_wagered NUMERIC, next_tier_name TEXT, next_tier_min NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_wagered NUMERIC;
BEGIN
  SELECT COALESCE(p.total_wagered, 0) INTO v_wagered FROM profiles p WHERE p.user_id = p_user_id;
  
  RETURN QUERY
  WITH current_tier AS (
    SELECT vt.* FROM vip_tiers vt WHERE vt.min_wagered <= v_wagered ORDER BY vt.min_wagered DESC LIMIT 1
  ),
  next_t AS (
    SELECT vt.name, vt.min_wagered FROM vip_tiers vt WHERE vt.min_wagered > v_wagered ORDER BY vt.min_wagered ASC LIMIT 1
  )
  SELECT ct.name, ct.icon, ct.color, ct.cashback_rate, ct.bonus_multiplier, v_wagered, nt.name, nt.min_wagered
  FROM current_tier ct LEFT JOIN next_t nt ON true;
END;
$$;

-- Function to redeem voucher
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_user_id UUID, p_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, amount NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_voucher RECORD;
  v_already_redeemed BOOLEAN;
BEGIN
  SELECT * INTO v_voucher FROM vouchers v WHERE v.code = UPPER(p_code) AND v.active = true;
  
  IF v_voucher IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired voucher code'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < now() THEN
    RETURN QUERY SELECT false, 'This voucher has expired'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  IF v_voucher.current_uses >= v_voucher.max_uses THEN
    RETURN QUERY SELECT false, 'This voucher has been fully redeemed'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  SELECT EXISTS(SELECT 1 FROM voucher_redemptions vr WHERE vr.user_id = p_user_id AND vr.voucher_id = v_voucher.id) INTO v_already_redeemed;
  
  IF v_already_redeemed THEN
    RETURN QUERY SELECT false, 'You have already used this voucher'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Redeem
  INSERT INTO voucher_redemptions (user_id, voucher_id, amount) VALUES (p_user_id, v_voucher.id, v_voucher.amount);
  UPDATE vouchers SET current_uses = current_uses + 1 WHERE id = v_voucher.id;
  UPDATE profiles SET balance = balance + v_voucher.amount WHERE profiles.user_id = p_user_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Voucher Redeemed!', 'You received $' || v_voucher.amount || ' from voucher ' || v_voucher.code, 'bonus');
  
  RETURN QUERY SELECT true, ('Voucher redeemed! $' || v_voucher.amount || ' added to your balance')::TEXT, v_voucher.amount;
END;
$$;

-- Update total_wagered when bet is placed (trigger)
CREATE OR REPLACE FUNCTION public.update_wagered_on_bet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET total_wagered = total_wagered + NEW.stake WHERE profiles.user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_wagered AFTER INSERT ON public.bets
FOR EACH ROW EXECUTE FUNCTION public.update_wagered_on_bet();
