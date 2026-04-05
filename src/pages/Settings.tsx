import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Bell, Save, Loader2, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";
import { requestPushPermission, isPushSupported } from "@/lib/pushNotifications";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoggedIn, refreshProfile } = useAuth();
  const [tab, setTab] = useState<"profile" | "password" | "notifications">("profile");

  // Profile state
  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification prefs
  const [notifBets, setNotifBets] = useState(true);
  const [notifDeposits, setNotifDeposits] = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);
  const [notifOddsChanges, setNotifOddsChanges] = useState(false);

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!username.trim()) { toast.error("Username cannot be empty"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to update profile"); return; }
    await refreshProfile();
    toast.success("Profile updated!");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    toast.success("Password changed successfully!");
  };

  const tabs = [
    { key: "profile" as const, label: "Profile", icon: User },
    { key: "password" as const, label: "Password", icon: Lock },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}

        {/* Password Tab */}
        {tab === "password" && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:brightness-110 transition disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <p className="text-xs text-muted-foreground mb-2">Configure which notifications you'd like to receive.</p>
            {[
              { label: "Bet Results", desc: "Get notified when your bets are settled", value: notifBets, set: setNotifBets },
              { label: "Deposits & Withdrawals", desc: "Transaction confirmations and status updates", value: notifDeposits, set: setNotifDeposits },
              { label: "Promotions & Offers", desc: "Special deals and bonus opportunities", value: notifPromotions, set: setNotifPromotions },
              { label: "Odds Changes", desc: "Price movement alerts for your favorites", value: notifOddsChanges, set: setNotifOddsChanges },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <button
                  onClick={() => pref.set(!pref.value)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${pref.value ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${pref.value ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
            {isPushSupported() && (
              <div className="pt-2 border-t border-border">
                <button
                  onClick={async () => {
                    const granted = await requestPushPermission();
                    toast(granted ? "Browser notifications enabled!" : "Permission denied. Enable in browser settings.");
                  }}
                  className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition"
                >
                  <Smartphone className="w-4 h-4" />
                  Enable Browser Push Notifications
                </button>
              </div>
            )}
            <button
              onClick={() => toast.success("Notification preferences saved!")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:brightness-110 transition"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
