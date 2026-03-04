import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BettingProvider } from "@/context/BettingContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import DepositModal from "@/components/DepositModal";
import Index from "./pages/Index";
import MatchDetail from "./pages/MatchDetail";
import BetHistory from "./pages/BetHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BettingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthModal />
          <DepositModal />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/history" element={<BetHistory />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BettingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
