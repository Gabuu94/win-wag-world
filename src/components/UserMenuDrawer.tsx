import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  X, Wallet, ArrowDownToLine, Users, Receipt, Ticket, MessageCircle,
  ClipboardList, Settings, Crown, ShieldCheck, LogOut, Home, Trophy,
  Tv, Gamepad2, BookOpen, FileText, Lock
} from "lucide-react";

interface UserMenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

const UserMenuDrawer = ({ open, onClose }: UserMenuDrawerProps) => {
  const { profile, isLoggedIn, logout, setShowDepositModal, setShowAuthModal } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "deposit":
        if (!isLoggedIn) { setShowAuthModal(true); onClose(); return; }
        setShowDepositModal(true);
        onClose();
        break;
      case "withdraw":
        if (!isLoggedIn) { setShowAuthModal(true); onClose(); return; }
        navigate("/withdraw");
        onClose();
        break;
      case "transactions":
        if (!isLoggedIn) { setShowAuthModal(true); onClose(); return; }
        navigate("/transactions");
        onClose();
        break;
      case "my-bets":
        if (!isLoggedIn) { setShowAuthModal(true); onClose(); return; }
        navigate("/history");
        onClose();
        break;
      case "settings":
        if (!isLoggedIn) { setShowAuthModal(true); onClose(); return; }
        navigate("/settings");
        onClose();
        break;
      case "chat":
        onClose();
        break;
      case "refer":
        if (!isLoggedIn) { setShowAuthModal(true); onClose(); return; }
        navigate("/referral");
        onClose();
        break;
      case "logout":
        logout();
        onClose();
        break;
      default:
        break;
    }
  };

  const accountItems = [
    { label: "Deposit", icon: Wallet, action: "deposit", active: true, highlight: true },
    { label: "Withdrawals", icon: ArrowDownToLine, action: "withdraw", active: true },
    { label: "Bring a Friend", icon: Users, action: "refer", active: true },
    { label: "Transaction History", icon: Receipt, action: "transactions", active: true },
    { label: "Voucher", icon: Ticket, action: "voucher", active: false },
    { label: "Chat", icon: MessageCircle, action: "chat", active: true },
    { label: "My Bets", icon: ClipboardList, action: "my-bets", active: true },
    { label: "Settings", icon: Settings, action: "settings", active: true },
    { label: "Activate VIP", icon: Crown, action: "vip", active: false },
    { label: "Verification", icon: ShieldCheck, action: "verify", active: false },
    { label: "Exit", icon: LogOut, action: "logout", active: true, destructive: true },
  ];

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Sport", icon: Trophy, path: "/" },
    { label: "Live Sport", icon: Tv, path: "/" },
    { label: "Deposit Guide", icon: BookOpen, path: "/" },
    { label: "Terms & Conditions", icon: FileText, path: "/" },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-xs bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            {isLoggedIn && profile ? (
              <>
                <p className="font-display font-bold text-sm">{profile.username}</p>
                <p className="text-xs text-primary font-bold">Balance: ${profile.balance.toFixed(2)}</p>
              </>
            ) : (
              <p className="font-display font-bold text-sm">Menu</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Section */}
        {isLoggedIn && (
          <div className="border-b border-border">
            {accountItems.map((item) => (
              <button
                key={item.label}
                onClick={() => item.active ? handleAction(item.action) : null}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition border-b border-border/50 last:border-0 ${
                  item.highlight
                    ? "bg-primary text-primary-foreground font-bold"
                    : item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : item.active
                    ? "text-foreground hover:bg-secondary"
                    : "text-muted-foreground/60 cursor-not-allowed"
                }`}
                disabled={!item.active}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {!item.active && (
                  <span className="ml-auto text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Soon</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Navigation Section */}
        <div>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition border-b border-border/50"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {!isLoggedIn && (
          <div className="p-4">
            <button
              onClick={() => { setShowAuthModal(true); onClose(); }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenuDrawer;
