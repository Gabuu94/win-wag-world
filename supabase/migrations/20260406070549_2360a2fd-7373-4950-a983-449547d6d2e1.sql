
-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all bets
CREATE POLICY "Admins can view all bets" ON public.bets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete promotions
CREATE POLICY "Admins can delete promotions" ON public.promotions
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update promotions
CREATE POLICY "Admins can update promotions" ON public.promotions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
