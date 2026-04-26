import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";

const GameShare = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("admin_games")
        .select("id")
        .eq("share_code", code.toUpperCase())
        .maybeSingle();

      if (err || !data) {
        setError("Game not found for this code");
        return;
      }
      navigate(`/match/admin-${data.id}`, { replace: true });
    })();
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center">
        {error ? (
          <div className="text-center">
            <h2 className="font-display text-xl font-bold mb-2">{error}</h2>
            <button onClick={() => navigate("/")} className="text-primary text-sm hover:underline">← Back to home</button>
          </div>
        ) : (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
            <p className="text-sm text-muted-foreground">Loading shared game…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GameShare;
