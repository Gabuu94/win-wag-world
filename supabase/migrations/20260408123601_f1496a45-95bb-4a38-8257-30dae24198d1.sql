
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, balance, referral_code, phone, country, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player'),
    0,
    'BK' || UPPER(SUBSTR(MD5(NEW.id::TEXT), 1, 6)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'country', 'KE'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'KES')
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
