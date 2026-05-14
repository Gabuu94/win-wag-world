import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TopBar from "@/components/TopBar";
import SportsSidebar from "@/components/SportsSidebar";
import LiveMatchesFeed from "@/components/LiveMatchesFeed";
import BettingSlip from "@/components/BettingSlip";
import GamesMarquee from "@/components/GamesMarquee";

const Index = () => {
  const [activeSport, setActiveSport] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, setShowDepositModal, setShowAuthModal } = useAuth();

  useEffect(() => {
    if (searchParams.get("deposit") === "1") {
      if (isLoggedIn) setShowDepositModal(true);
      else setShowAuthModal(true);
      searchParams.delete("deposit");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isLoggedIn, setShowDepositModal, setShowAuthModal, setSearchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar activeSport={activeSport} onSportChange={setActiveSport} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <GamesMarquee />
      <div className="flex flex-1 overflow-hidden">
        <SportsSidebar activeSport={activeSport} onSportChange={setActiveSport} />
        <LiveMatchesFeed sportKey={activeSport} searchQuery={searchQuery} />
        <BettingSlip />
      </div>
    </div>
  );
};

export default Index;
