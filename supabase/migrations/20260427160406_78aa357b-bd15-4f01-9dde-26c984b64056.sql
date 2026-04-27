CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit reset request"
ON public.password_reset_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all reset requests"
ON public.password_reset_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reset requests"
ON public.password_reset_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reset requests"
ON public.password_reset_requests FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_password_reset_status ON public.password_reset_requests(status, created_at DESC);