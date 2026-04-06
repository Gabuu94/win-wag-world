import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gift, Clock, Percent, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Promotion {
  id: string;
  title: string;
  description: string;
  bonus_type: string;
  bonus_value: number;
  min_deposit: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  image_url: string | null;
}

const Promotions = () => {
  const navigate = useNavigate();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("promotions").select("*").eq("active", true).then(({ data }) => {
      setPromos((data as any[]) || []);
      setLoading(false);
    });
  }, []);

  const getBonusIcon = (type: string) => {
    switch (type) {
      case "deposit_match": return <Percent className="w-5 h-5" />;
      case "free_bet": return <Gift className="w-5 h-5" />;
      case "cashback": return <DollarSign className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-display text-lg font-bold">Promotions & Offers</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading promotions...</div>
        ) : promos.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active promotions right now. Check back soon!</p>
          </div>
        ) : (
          promos.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    {getBonusIcon(p.bonus_type)}
                  </div>
                  <h3 className="font-display font-bold text-lg">{p.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {p.bonus_type === "deposit_match" ? `${p.bonus_value}% Match` : p.bonus_type === "free_bet" ? `$${p.bonus_value} Free Bet` : `${p.bonus_value}% Cashback`}
                  </span>
                  {p.min_deposit > 0 && (
                    <span className="bg-secondary text-muted-foreground px-2 py-1 rounded-full">Min deposit: ${p.min_deposit}</span>
                  )}
                  {p.end_date && (
                    <span className="bg-secondary text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ends {format(new Date(p.end_date), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Promotions;
