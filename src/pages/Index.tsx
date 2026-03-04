import TopBar from "@/components/TopBar";
import SportsSidebar from "@/components/SportsSidebar";
import LiveMatchesFeed from "@/components/LiveMatchesFeed";
import BettingSlip from "@/components/BettingSlip";
import { BettingProvider } from "@/context/BettingContext";

const Index = () => {
  return (
    <BettingProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <SportsSidebar />
          <LiveMatchesFeed />
          <BettingSlip />
        </div>
      </div>
    </BettingProvider>
  );
};

export default Index;
