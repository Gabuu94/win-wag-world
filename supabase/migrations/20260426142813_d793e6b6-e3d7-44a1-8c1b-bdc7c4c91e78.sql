-- Function to auto-finish admin games whose end_time has passed
CREATE OR REPLACE FUNCTION public.auto_finish_admin_games()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_games
  SET status = 'finished',
      updated_at = now()
  WHERE end_time IS NOT NULL
    AND end_time <= now()
    AND status <> 'finished';
END;
$$;

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any prior schedule to avoid duplicates
DO $$
BEGIN
  PERFORM cron.unschedule('auto-finish-admin-games');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule every minute
SELECT cron.schedule(
  'auto-finish-admin-games',
  '* * * * *',
  $$ SELECT public.auto_finish_admin_games(); $$
);