-- Short shareable betslip codes
CREATE TABLE public.betslip_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  selections JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  load_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_betslip_codes_code ON public.betslip_codes(code);

ALTER TABLE public.betslip_codes ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can read codes to load shared slips
CREATE POLICY "Anyone can view betslip codes"
ON public.betslip_codes FOR SELECT
USING (true);

-- Anyone authenticated or anon can create a code (for sharing)
CREATE POLICY "Anyone can create betslip codes"
ON public.betslip_codes FOR INSERT
WITH CHECK (true);

-- Allow updating load_count
CREATE POLICY "Anyone can update load count"
ON public.betslip_codes FOR UPDATE
USING (true);
