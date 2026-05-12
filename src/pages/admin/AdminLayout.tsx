import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, Receipt, MessageCircle, Gamepad2, 
  Gift, LogOut, Menu, X, ChevronRight, KeyRound, Mail, Ticket
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/transactions", label: "Transactions", icon: Receipt },
  { path: "/admin/support", label: "Support Chat", icon: MessageCircle },
  { path: "/admin/email-replies", label: "Email Replies", icon: Mail },
  { path: "/admin/games", label: "Game Manager", icon: Gamepad2 },
  { path: "/admin/promotions", label: "Promotions", icon: Gift },
  { path: "/admin/vouchers", label: "Vouchers", icon: Ticket },
  { path: "/admin/password-resets", label: "Password Resets", icon: KeyRound },
];

const AdminLayout = () => {
  const { isAdmin, loading } = useAdmin();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
        <button onClick={() => navigate("/")} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">
            <span className="text-primary">BET</span><span className="text-accent">KING</span>
            <span className="text-xs text-muted-foreground ml-2">Admin</span>
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary">
            <ChevronRight className="w-4 h-4" /> Back to Site
          </button>
          <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-display font-bold text-sm"><span className="text-primary">BET</span><span className="text-accent">KING</span> Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
