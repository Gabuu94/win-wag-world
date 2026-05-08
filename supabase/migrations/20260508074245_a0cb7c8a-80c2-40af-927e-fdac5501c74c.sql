CREATE OR REPLACE FUNCTION public.prevent_non_admin_profile_flag_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND (
       NEW.is_flagged IS DISTINCT FROM OLD.is_flagged OR
       NEW.flag_reason IS DISTINCT FROM OLD.flag_reason OR
       NEW.flagged_at IS DISTINCT FROM OLD.flagged_at OR
       NEW.flagged_by IS DISTINCT FROM OLD.flagged_by
     ) THEN
    RAISE EXCEPTION 'Only admins can change account flags';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_non_admin_profile_flag_changes ON public.profiles;
CREATE TRIGGER prevent_non_admin_profile_flag_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_profile_flag_changes();