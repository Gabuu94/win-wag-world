import { useState } from "react";
import TopBar from "@/components/TopBar";
import SportsSidebar from "@/components/SportsSidebar";
import LiveMatchesFeed from "@/components/LiveMatchesFeed";
import BettingSlip from "@/components/BettingSlip";
import GamesMarquee from "@/components/GamesMarquee";

const Index = () => {
  const [activeSport, setActiveSport] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

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
