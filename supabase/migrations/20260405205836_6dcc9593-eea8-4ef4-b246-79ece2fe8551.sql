
-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = 'BK' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)) WHERE referral_code IS NULL;

-- Make referral_code NOT NULL with default
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT 'BK' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  bonus_amount NUMERIC NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Update handle_new_user to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, balance, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player'),
    0,
    'BK' || UPPER(SUBSTR(MD5(NEW.id::TEXT), 1, 6))
  );
  
  -- If user signed up with a referral code, process it
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    DECLARE
      v_referrer_id UUID;
    BEGIN
      SELECT user_id INTO v_referrer_id FROM public.profiles 
      WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
      
      IF v_referrer_id IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_id, referral_code, bonus_amount, status)
        VALUES (v_referrer_id, NEW.id, NEW.raw_user_meta_data->>'referral_code', 5, 'completed');
        
        UPDATE public.profiles SET balance = balance + 5 WHERE user_id = v_referrer_id;
        
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (v_referrer_id, 'Referral Bonus!', 'You earned $5 for referring a friend!', 'bonus');
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;
