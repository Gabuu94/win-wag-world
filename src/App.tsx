import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BettingProvider } from "@/context/BettingContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import DepositModal from "@/components/DepositModal";
import ChatSupport from "@/components/ChatSupport";
import Index from "./pages/Index";
import MatchDetail from "./pages/MatchDetail";
import BetHistory from "./pages/BetHistory";
import TransactionHistory from "./pages/TransactionHistory";
import Withdraw from "./pages/Withdraw";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <BettingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthModal />
            <DepositModal />
            <ChatSupport />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/history" element={<BetHistory />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BettingProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
