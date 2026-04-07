
CREATE POLICY "Admins can update bets" ON public.bets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
