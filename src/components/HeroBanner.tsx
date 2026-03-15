import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-4">
      <img
        src={heroBanner}
        alt="Sports betting action"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center">
        <div className="px-6 md:px-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">
            Live Now
          </p>
          <h2 className="font-display text-2xl md:text-4xl font-bold leading-tight mb-2">
            Champions League
            <br />
            <span className="text-primary">Quarter Finals</span>
          </h2>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-bold hover:brightness-110 transition mt-1"
          >
            Bet Now →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
