
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  bonus_type TEXT NOT NULL DEFAULT 'deposit_match',
  bonus_value NUMERIC NOT NULL DEFAULT 0,
  min_deposit NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin custom games
CREATE TABLE public.admin_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT NOT NULL DEFAULT 'football',
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT DEFAULT 'Custom League',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming',
  is_published BOOLEAN NOT NULL DEFAULT false,
  result_home INTEGER,
  result_away INTEGER,
  half_time_home INTEGER,
  half_time_away INTEGER,
  has_extra_time BOOLEAN DEFAULT false,
  extra_time_result_home INTEGER,
  extra_time_result_away INTEGER,
  has_penalties BOOLEAN DEFAULT false,
  penalty_home INTEGER,
  penalty_away INTEGER,
  current_minute INTEGER DEFAULT 0,
  current_period TEXT DEFAULT 'not_started',
  quarters_scores JSONB DEFAULT '[]'::jsonb,
  total_corners_home INTEGER DEFAULT 0,
  total_corners_away INTEGER DEFAULT 0,
  total_cards_home INTEGER DEFAULT 0,
  total_cards_away INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published games" ON public.admin_games
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage games" ON public.admin_games
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Game markets
CREATE TABLE public.admin_game_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.admin_games(id) ON DELETE CASCADE,
  market_type TEXT NOT NULL,
  market_name TEXT NOT NULL,
  selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_game_markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active markets" ON public.admin_game_markets
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage markets" ON public.admin_game_markets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Support messages
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND sender_role = 'user');
CREATE POLICY "Admins can view all messages" ON public.support_messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update messages" ON public.support_messages
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for support messages and admin games
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_games;

-- Trigger for updated_at on admin_games
CREATE TRIGGER update_admin_games_updated_at
  BEFORE UPDATE ON public.admin_games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
