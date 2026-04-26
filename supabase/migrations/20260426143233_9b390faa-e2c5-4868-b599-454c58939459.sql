-- Add share_code column
ALTER TABLE public.admin_games
  ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;

-- Function to generate a unique 5-char alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_game_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- skip ambiguous chars
  i INT;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..5 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.admin_games WHERE share_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Trigger to auto-fill share_code on insert
CREATE OR REPLACE FUNCTION public.set_game_share_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    NEW.share_code := public.generate_game_share_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_game_share_code ON public.admin_games;
CREATE TRIGGER trg_set_game_share_code
  BEFORE INSERT ON public.admin_games
  FOR EACH ROW EXECUTE FUNCTION public.set_game_share_code();

-- Backfill existing games
UPDATE public.admin_games SET share_code = public.generate_game_share_code() WHERE share_code IS NULL;

-- Allow public lookup by share_code (read-only) for already-published games via existing policy.
-- Add a policy so even unpublished games can be loaded by direct code (so admin can preview shared link):
CREATE POLICY "Anyone can view games by share code"
  ON public.admin_games FOR SELECT
  USING (share_code IS NOT NULL);