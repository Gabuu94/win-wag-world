
-- Create support conversations table to track chat status
CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  closed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.support_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.support_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.support_conversations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage conversations" ON public.support_conversations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add attachment_url to support_messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_url text;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload support attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view support attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'support-attachments');

-- Add phone column to profiles for phone signup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'KE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KES';
