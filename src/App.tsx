import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { BettingProvider } from "@/context/BettingContext";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import DepositModal from "@/components/DepositModal";
import ChatSupport from "@/components/ChatSupport";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import MatchDetail from "./pages/MatchDetail";
import BetHistory from "./pages/BetHistory";
import TransactionHistory from "./pages/TransactionHistory";
import Withdraw from "./pages/Withdraw";
import Settings from "./pages/Settings";

import VIP from "./pages/VIP";
import Voucher from "./pages/Voucher";
import Verification from "./pages/Verification";
import Promotions from "./pages/Promotions";
import VirtualGames from "./pages/VirtualGames";
import NotFound from "./pages/NotFound";
import GameShare from "./pages/GameShare";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminGameCreator from "./pages/admin/AdminGameCreator";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminPasswordResets from "./pages/admin/AdminPasswordResets";
import AdminEmailReplies from "./pages/admin/AdminEmailReplies";

const queryClient = new QueryClient();

const DepositLinkHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setShowDepositModal } = useAuth();

  useEffect(() => {
    if (searchParams.get("deposit") !== "1") return;
    setShowDepositModal(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("deposit");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, setShowDepositModal]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <BettingProvider>
          <TooltipProvider>
            <SplashScreen />
            <Toaster />
            <Sonner />
            <AuthModal />
            <ForgotPasswordModal />
            <DepositModal />
            <DepositLinkHandler />
            <ChatSupport />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/g/:code" element={<GameShare />} />
              <Route path="/history" element={<BetHistory />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/settings" element={<Settings />} />
              
              <Route path="/vip" element={<VIP />} />
              <Route path="/voucher" element={<Voucher />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/virtuals" element={<VirtualGames />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="games" element={<AdminGameCreator />} />
                <Route path="promotions" element={<AdminPromotions />} />
                <Route path="password-resets" element={<AdminPasswordResets />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BettingProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
