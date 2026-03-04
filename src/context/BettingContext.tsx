import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface BetSelection {
  id: string; // matchId + pick
  matchLabel: string; // "Team1 vs Team2"
  pick: string; // "Home", "Draw", "Away"
  odds: number;
}

interface BettingContextType {
  selections: BetSelection[];
  toggleSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
  stake: number;
  setStake: (v: number) => void;
}

const BettingContext = createContext<BettingContextType | null>(null);

export const useBetting = () => {
  const ctx = useContext(BettingContext);
  if (!ctx) throw new Error("useBetting must be used within BettingProvider");
  return ctx;
};

export const BettingProvider = ({ children }: { children: ReactNode }) => {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState(10);

  const toggleSelection = useCallback((selection: BetSelection) => {
    setSelections((prev) => {
      const exists = prev.find((s) => s.id === selection.id);
      if (exists) return prev.filter((s) => s.id !== selection.id);
      // Remove any existing selection from the same match (only one pick per match)
      const matchPrefix = selection.id.split("-").slice(0, -1).join("-");
      const filtered = prev.filter(
        (s) => !s.id.startsWith(matchPrefix) || s.id === selection.id
      );
      return [...filtered, selection];
    });
  }, []);

  const removeSelection = useCallback((id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => setSelections([]), []);

  const isSelected = useCallback(
    (id: string) => selections.some((s) => s.id === id),
    [selections]
  );

  return (
    <BettingContext.Provider
      value={{ selections, toggleSelection, removeSelection, clearAll, isSelected, stake, setStake }}
    >
      {children}
    </BettingContext.Provider>
  );
};
