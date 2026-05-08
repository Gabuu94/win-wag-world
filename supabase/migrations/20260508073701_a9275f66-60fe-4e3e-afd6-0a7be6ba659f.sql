ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS flagged_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS flagged_by uuid;

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL,
  amount numeric,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can view admin action logs"
ON public.admin_action_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can create admin action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can create admin action logs"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target_user_id_created_at
ON public.admin_action_logs (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_is_flagged
ON public.profiles (is_flagged);