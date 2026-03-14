import { useState } from "react";
import TopBar from "@/components/TopBar";
import SportsSidebar from "@/components/SportsSidebar";
import LiveMatchesFeed from "@/components/LiveMatchesFeed";
import BettingSlip from "@/components/BettingSlip";

const Index = () => {
  const [activeSport, setActiveSport] = useState("upcoming");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar activeSport={activeSport} onSportChange={setActiveSport} />
      <div className="flex flex-1 overflow-hidden">
        <SportsSidebar />
        <LiveMatchesFeed sportKey={activeSport} />
        <BettingSlip />
      </div>
    </div>
  );
};

export default Index;
