import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Send, RefreshCw, CheckCircle2, XCircle, Image as ImageIcon, Eye } from "lucide-react";
import UserDetailDrawer from "@/components/admin/UserDetailDrawer";

interface ChatUser {
  user_id: string;
  username: string;
  unread: number;
  lastMessage: string;
  lastTime: string;
  status: string;
}

interface Message {
  id: string;
  user_id: string;
  sender_role: string;
  message: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string | null;
}

const AdminSupport = () => {
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChatUsers = async () => {
    setLoading(true);
    const { data: msgs } = await supabase.from("support_messages").select("*").order("created_at", { ascending: false });
    if (!msgs) { setLoading(false); return; }

    const userMap = new Map<string, { messages: any[]; unread: number }>();
    msgs.forEach((m: any) => {
      if (!userMap.has(m.user_id)) userMap.set(m.user_id, { messages: [], unread: 0 });
      const u = userMap.get(m.user_id)!;
      u.messages.push(m);
      if (!m.is_read && m.sender_role === "user") u.unread++;
    });

    const userIds = Array.from(userMap.keys());
    const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.username]));

    // Get conversation statuses
    const { data: convs } = await supabase.from("support_conversations").select("*");
    const convMap = new Map((convs || []).map((c: any) => [c.user_id, c.status]));

    const users: ChatUser[] = userIds.map((uid) => {
      const u = userMap.get(uid)!;
      const last = u.messages[0];
      return {
        user_id: uid,
        username: profileMap.get(uid) || "Unknown",
        unread: u.unread,
        lastMessage: last?.message || "",
        lastTime: last?.created_at || "",
        status: convMap.get(uid) || "open",
      };
    }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

    setChatUsers(users);
    setLoading(false);
  };

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase.from("support_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    await supabase.from("support_messages").update({ is_read: true }).eq("user_id", userId).eq("sender_role", "user");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { fetchChatUsers(); }, []);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages(selectedUser);

    const channel = supabase.channel(`admin-support-${selectedUser}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${selectedUser}` }, () => {
        fetchMessages(selectedUser);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedUser || !user) return;
    await supabase.from("support_messages").insert({
      user_id: selectedUser,
      sender_role: "admin",
      message: newMsg.trim(),
    });
    setNewMsg("");
    fetchMessages(selectedUser);
  };

  const resolveChat = async (userId: string) => {
    // Upsert conversation status
    const { data: existing } = await supabase.from("support_conversations").select("id").eq("user_id", userId).eq("status", "open");
    if (existing && existing.length > 0) {
      await supabase.from("support_conversations").update({ status: "resolved", closed_at: new Date().toISOString(), closed_by: user?.id }).eq("id", existing[0].id);
    } else {
      await supabase.from("support_conversations").insert({ user_id: userId, status: "resolved", closed_at: new Date().toISOString(), closed_by: user?.id });
    }
    // Send system message
    await supabase.from("support_messages").insert({
      user_id: userId,
      sender_role: "admin",
      message: "✅ This issue has been marked as resolved. If you need further help, feel free to send a new message.",
    });
    fetchChatUsers();
    fetchMessages(userId);
  };

  const reopenChat = async (userId: string) => {
    await supabase.from("support_conversations").update({ status: "open", closed_at: null }).eq("user_id", userId);
    fetchChatUsers();
  };

  const selectedStatus = chatUsers.find(u => u.user_id === selectedUser)?.status || "open";

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Support Chat</h2>
      <div className="flex bg-card border border-border rounded-xl overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">Conversations</span>
            <button onClick={fetchChatUsers}><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Loading...</p>
            ) : chatUsers.length === 0 ? (
              <p className="text-center py-4 text-sm text-muted-foreground">No conversations</p>
            ) : chatUsers.map((cu) => (
              <button
                key={cu.user_id}
                onClick={() => setSelectedUser(cu.user_id)}
                className={`w-full text-left p-3 border-b border-border/50 transition ${selectedUser === cu.user_id ? "bg-primary/10" : "hover:bg-secondary"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{cu.username}</span>
                  <div className="flex items-center gap-1">
                    {cu.status === "resolved" && <CheckCircle2 className="w-3 h-3 text-primary" />}
                    {cu.unread > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{cu.unread}</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{cu.lastMessage}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
          ) : (
            <>
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{chatUsers.find(u => u.user_id === selectedUser)?.username}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedStatus === "resolved" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                    {selectedStatus}
                  </span>
                </div>
                <div className="flex gap-1">
                  {selectedStatus === "open" ? (
                    <button onClick={() => resolveChat(selectedUser)} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20">
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                  ) : (
                    <button onClick={() => reopenChat(selectedUser)} className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded hover:bg-accent/20">
                      <XCircle className="w-3 h-3" /> Reopen
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${m.sender_role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {m.attachment_url && (
                        <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                          <img src={m.attachment_url} alt="attachment" className="max-w-full rounded max-h-40 object-cover" />
                        </a>
                      )}
                      {m.message}
                      <div className={`text-[10px] mt-1 ${m.sender_role === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm outline-none"
                />
                <button onClick={sendMessage} className="bg-primary text-primary-foreground p-2 rounded-md hover:brightness-110">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
