
CREATE TABLE public.email_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email text NOT NULL,
  from_name text,
  to_email text,
  subject text,
  text_body text,
  html_body text,
  raw_headers jsonb DEFAULT '{}'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  matched_user_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  forwarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_replies_created_at ON public.email_replies (created_at DESC);
CREATE INDEX idx_email_replies_from_email ON public.email_replies (from_email);

ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all replies"
  ON public.email_replies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update replies"
  ON public.email_replies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert replies"
  ON public.email_replies FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
