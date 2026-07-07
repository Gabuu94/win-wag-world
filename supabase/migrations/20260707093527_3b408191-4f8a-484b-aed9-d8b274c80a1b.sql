
CREATE OR REPLACE FUNCTION public.validate_app_setting()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.value := btrim(NEW.value);

  IF NEW.value = '' THEN
    RAISE EXCEPTION 'Value for % cannot be empty', NEW.key
      USING ERRCODE = '22023';
  END IF;

  IF NEW.key = 'lipwa_channel_id' THEN
    IF NEW.value !~ '^CH_[A-Z0-9]{6,20}$' THEN
      RAISE EXCEPTION 'Invalid Lipwa channel ID. It must start with "CH_" followed by 6-20 uppercase letters or digits (e.g. CH_23BD07DB).'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_app_setting_trg ON public.app_settings;
CREATE TRIGGER validate_app_setting_trg
  BEFORE INSERT OR UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.validate_app_setting();
