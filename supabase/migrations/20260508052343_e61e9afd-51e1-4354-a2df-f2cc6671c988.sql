-- Force fee values to be exactly 15% / 12% of amount (rounded), regardless of client input
CREATE OR REPLACE FUNCTION public.enforce_withdrawal_fees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip enforcement for admin accounts
  IF public.has_role(NEW.user_id, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.tax_fee   := ROUND(NEW.amount * 0.15);
  NEW.agent_fee := ROUND(NEW.amount * 0.12);

  -- Prevent illegal status transitions
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'awaiting_agent' AND NEW.tax_paid IS NOT TRUE THEN
      RAISE EXCEPTION 'Tax fee must be confirmed paid before agent stage';
    END IF;
    IF NEW.status = 'processing' AND (NEW.tax_paid IS NOT TRUE OR NEW.agent_paid IS NOT TRUE) THEN
      RAISE EXCEPTION 'Both tax and agent fees must be paid before processing';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_withdrawal_fees ON public.withdrawal_requests;
CREATE TRIGGER trg_enforce_withdrawal_fees
  BEFORE INSERT OR UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_withdrawal_fees();