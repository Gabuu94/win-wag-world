import { X, Trash2, Share2, ClipboardPaste, ChevronUp, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { useBetting } from "@/context/BettingContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { formatMoney, currencySymbol, isKenyan } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-Z0-9]{6}$/;

// Generate a 6-character uppercase alphanumeric code (no confusing chars like 0/O, 1/I)
const generateShortCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const BettingSlipContent = () => {
  const { selections, removeSelection, clearAll, stake, setStake, loadFromCode } = useBetting();
  const { isLoggedIn, profile, user, placeBet, setShowAuthModal, setShowDepositModal } = useAuth();

  // Load-code dialog state
  const [loadOpen, setLoadOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Share-code result state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalOdds = selections.length > 0
    ? selections.reduce((acc, b) => acc * b.odds, 1)
    : 0;
  const potentialWin = stake * totalOdds;
  const betType = selections.length > 1 ? "Accumulator" : "Single";

  const handlePlaceBet = async () => {
    if (selections.length === 0) {
      toast.error("Add selections to your bet slip first!");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Please sign in to place bets");
      setShowAuthModal(true);
      return;
    }
    const bettable = profile ? Math.max(0, profile.balance - (profile.winnings_balance || 0)) : 0;
    if (!profile || bettable < stake) {
      if (profile && (profile.winnings_balance || 0) > 0) {
        toast.error("Winnings cannot be wagered. Withdraw them first or top up with a new deposit.");
      } else {
        toast.error("Insufficient balance. Please deposit funds.");
      }
      setShowDepositModal(true);
      return;
    }
    if (stake <= 0) {
      toast.error("Enter a valid stake amount");
      return;
    }

    const ok = await placeBet({
      selections: selections.map((s) => ({ matchLabel: s.matchLabel, pick: s.pick, odds: s.odds })),
      stake,
      totalOdds,
      potentialWin,
    });

    if (ok) {
      toast.success(
        `${betType} placed! ${formatMoney(stake, profile)} on ${selections.length} selection(s) — Potential win: ${formatMoney(potentialWin, profile)}`
      );
      clearAll();
    } else {
      toast.error("Failed to place bet. Check your balance.");
    }
  };

  const generateCode = async () => {
    if (selections.length === 0) {
      toast.error("No selections to share");
      return;
    }
    setSharing(true);
    setShareCode(null);
    setCopied(false);
    setShareOpen(true);
    // Try a few times in case of unique-collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateShortCode();
      const { error } = await supabase
        .from("betslip_codes")
        .insert({
          code,
          selections: selections as any,
          created_by: user?.id ?? null,
        });
      if (!error) {
        setShareCode(code);
        setSharing(false);
        // Best-effort copy
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        } catch {
          /* clipboard may be blocked; user can copy manually */
        }
        return;
      }
      if (error.code !== "23505") {
        setSharing(false);
        setShareOpen(false);
        toast.error("Could not generate code. Try again.");
        return;
      }
    }
    setSharing(false);
    setShareOpen(false);
    toast.error("Could not generate a unique code. Try again.");
  };

  const copyShareCode = async () => {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the code to copy manually.");
    }
  };

  // Sanitise input: uppercase A-Z and 0-9 only, max 6 chars
  const onCodeInputChange = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    setCodeInput(cleaned);
    if (loadError) setLoadError(null);
  };

  const handleLoadCode = async () => {
    const raw = codeInput.trim().toUpperCase();
    if (!raw) {
      setLoadError("Enter a 6-character betslip code.");
      return;
    }
    if (!CODE_REGEX.test(raw)) {
      setLoadError("Code must be exactly 6 letters or numbers (A–Z, 0–9).");
      return;
    }

    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("betslip_codes")
      .select("selections, id, load_count")
      .eq("code", raw)
      .maybeSingle();

    if (error) {
      setLoading(false);
      setLoadError("Something went wrong. Please try again.");
      return;
    }
    if (!data) {
      setLoading(false);
      setLoadError(`Code "${raw}" not found. Check the code and try again.`);
      return;
    }
    const decoded = data.selections as any;
    if (!Array.isArray(decoded) || decoded.length === 0) {
      setLoading(false);
      setLoadError("This betslip is empty or has expired.");
      return;
    }

    loadFromCode(decoded);
    toast.success(`Loaded ${decoded.length} selection(s) from code ${raw}`);
    // Best-effort load count bump
    supabase
      .from("betslip_codes")
      .update({ load_count: (data.load_count ?? 0) + 1 })
      .eq("id", data.id)
      .then(() => {});
    setCodeInput("");
    setLoading(false);
    setLoadOpen(false);
  };

  const openLoadDialog = () => {
    setCodeInput("");
    setLoadError(null);
    setLoadOpen(true);
  };

  const ke = isKenyan(profile);
  const quickStakes = ke ? [50, 100, 250, 500, 1000] : [5, 10, 25, 50, 100];
  const sym = currencySymbol(profile);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Bet Slip</h3>
          {selections.length > 1 && (
            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold uppercase">
              {betType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {selections.length}
          </span>
          {selections.length > 0 && (
            <>
              <button onClick={generateCode} className="text-muted-foreground hover:text-primary transition" title="Copy betslip code">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={clearAll} className="text-muted-foreground hover:text-destructive transition" title="Clear all">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Load Code */}
      <div className="px-3 pt-2">
        <button
          onClick={openLoadDialog}
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition w-full bg-secondary/50 hover:bg-secondary rounded-md py-2 border border-border"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Load betslip code</span>
        </button>
      </div>

      {/* Selections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {selections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-muted-foreground text-sm mb-1">No selections yet</p>
            <p className="text-muted-foreground/60 text-xs">Click on odds to add to your slip</p>
          </div>
        ) : (
          selections.map((bet) => (
            <div key={bet.id} className="bg-secondary rounded-md p-3 relative animate-in slide-in-from-right-2 duration-200">
              <button onClick={() => removeSelection(bet.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition">
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-muted-foreground mb-1">{bet.matchLabel}</p>
              <p className="text-sm font-medium mb-1">{bet.pick}</p>
              <span className="text-primary font-bold text-sm">{bet.odds.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Odds ({betType})</span>
          <span className="font-bold text-primary">{totalOdds > 0 ? totalOdds.toFixed(2) : "—"}</span>
        </div>

        <div className="flex gap-1.5">
          {quickStakes.map((qs) => (
            <button
              key={qs}
              onClick={() => setStake(qs)}
              className={`flex-1 text-[10px] py-1 rounded transition ${
                stake === qs ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {ke ? `${qs}` : `$${qs}`}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-secondary rounded-md overflow-hidden">
          <span className="text-xs text-muted-foreground px-3 font-bold">{sym}</span>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
            className="bg-transparent text-sm font-medium text-foreground py-2 outline-none w-full"
            min={0}
          />
        </div>

        {isLoggedIn && profile && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium text-foreground">{formatMoney(profile.balance, profile)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Potential Win</span>
          <span className="font-bold text-accent">{potentialWin > 0 ? formatMoney(potentialWin, profile) : "—"}</span>
        </div>

        <button
          onClick={handlePlaceBet}
          disabled={selections.length === 0}
          className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {!isLoggedIn ? "Sign In to Bet" : `Place ${betType}`}
        </button>
      </div>

      {/* Load Code Dialog */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Load Betslip Code</DialogTitle>
            <DialogDescription>
              Enter the 6-character code shared with you to load the same selections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              autoFocus
              value={codeInput}
              onChange={(e) => onCodeInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoadCode();
              }}
              placeholder="ABC123"
              maxLength={CODE_LENGTH}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              className={`w-full bg-secondary text-foreground text-center text-2xl font-mono font-bold tracking-[0.5em] py-3 rounded-md outline-none border-2 transition ${
                loadError ? "border-destructive" : "border-transparent focus:border-primary"
              }`}
            />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Letters & numbers only</span>
              <span className={codeInput.length === CODE_LENGTH ? "text-primary font-bold" : ""}>
                {codeInput.length}/{CODE_LENGTH}
              </span>
            </div>

            {loadError && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loadError}</span>
              </div>
            )}

            <button
              onClick={handleLoadCode}
              disabled={loading || codeInput.length !== CODE_LENGTH}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : "Load Selections"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Code Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Share Your Betslip</DialogTitle>
            <DialogDescription>
              Share this 6-character code. Anyone can paste it into "Load betslip code" to get your exact selections.
            </DialogDescription>
          </DialogHeader>

          {sharing || !shareCode ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Generating code…</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-secondary border-2 border-primary/30 rounded-md py-5 text-center">
                <p className="font-mono text-3xl font-bold tracking-[0.5em] text-primary select-all">
                  {shareCode}
                </p>
              </div>

              <button
                onClick={copyShareCode}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
              </button>

              <p className="text-[11px] text-muted-foreground text-center">
                {selections.length} selection(s) • Total odds {totalOdds.toFixed(2)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Desktop sidebar version
const BettingSlipDesktop = () => (
  <aside className="hidden xl:flex flex-col w-72 bg-card border-l border-border h-[calc(100vh-8rem)]">
    <BettingSlipContent />
  </aside>
);

// Mobile floating button + drawer
const BettingSlipMobile = () => {
  const { selections } = useBetting();
  const [open, setOpen] = useState(false);

  const totalOdds = selections.length > 0
    ? selections.reduce((acc, b) => acc * b.odds, 1)
    : 0;

  return (
    <div className="xl:hidden">
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center gap-2 px-4 py-3 font-display font-bold text-sm uppercase glow-green"
      >
        <ChevronUp className="w-4 h-4" />
        Slip
        {selections.length > 0 && (
          <span className="bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {selections.length}
          </span>
        )}
        {totalOdds > 0 && (
          <span className="text-xs opacity-80">{totalOdds.toFixed(2)}</span>
        )}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-card border-t border-border rounded-t-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-2 pb-1">
              <button onClick={() => setOpen(false)} className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            <BettingSlipContent />
          </div>
        </div>
      )}
    </div>
  );
};

const BettingSlip = () => (
  <>
    <BettingSlipDesktop />
    <BettingSlipMobile />
  </>
);

export default BettingSlip;
