import { useBetting } from "@/context/BettingContext";

interface OddsButtonProps {
  label: string;
  odds: number;
  selectionId: string;
  matchLabel: string;
  pick: string;
}

const OddsButton = ({ label, odds, selectionId, matchLabel, pick }: OddsButtonProps) => {
  const { toggleSelection, isSelected } = useBetting();
  const selected = isSelected(selectionId);

  const handleClick = () => {
    toggleSelection({ id: selectionId, matchLabel, pick, odds });
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-md border text-xs transition-all odds-hover min-w-[60px] ${
        selected
          ? "bg-primary/20 border-primary text-primary"
          : "bg-secondary border-border text-secondary-foreground"
      }`}
    >
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-bold text-sm">{odds.toFixed(2)}</span>
    </button>
  );
};

export default OddsButton;
