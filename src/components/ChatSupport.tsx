import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Paperclip, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  sender_role: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string | null;
}

const ChatSupport = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<string>("open");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, user, setShowAuthModal } = useAuth();

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);

    // Check conversation status
    const { data: convs } = await supabase
      .from("support_conversations")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (convs && convs.length > 0) {
      setConversationStatus(convs[0].status);
    } else {
      setConversationStatus("open");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      // Subscribe to new messages
      const channel = supabase
        .channel(`support-${user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${user.id}`,
        }, () => fetchMessages())
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "support_conversations",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          const conv = payload.new as any;
          if (conv) setConversationStatus(conv.status);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [open, user]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [messages]);

  const sendMessage = async (attachmentUrl?: string) => {
    if ((!input.trim() && !attachmentUrl) || !user) return;
    const msg = input.trim();
    setInput("");

    // Ensure conversation exists
    const { data: existingConvs } = await supabase
      .from("support_conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "open");
    if (!existingConvs || existingConvs.length === 0) {
      await supabase.from("support_conversations").insert({ user_id: user.id, status: "open" });
    }

    await supabase.from("support_messages").insert({
      user_id: user.id,
      sender_role: "user",
      message: msg || "📎 Attachment",
      attachment_url: attachmentUrl || null,
    });
    fetchMessages();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(path);
    await sendMessage(urlData.publicUrl);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          if (!isLoggedIn) { setShowAuthModal(true); return; }
          setOpen(true);
        }}
        className="fixed bottom-20 right-4 z-[100] bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:brightness-110 transition animate-in fade-in"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 max-h-[480px] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between p-3 border-b border-border bg-primary rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary-foreground" />
          <div>
            <p className="text-sm font-bold text-primary-foreground">Support Chat</p>
            <p className="text-[10px] text-primary-foreground/70">
              {conversationStatus === "resolved" ? "Issue resolved ✓" : "We'll reply shortly"}
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {conversationStatus === "resolved" && (
        <div className="bg-primary/10 border-b border-border px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-xs text-primary font-medium">Your issue has been resolved</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px] max-h-[340px]">
        {loading ? (
          <p className="text-center text-xs text-muted-foreground py-8">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Send a message to start a conversation with our support team.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.sender_role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.sender_role === "admin" ? "bg-primary/10" : "bg-accent/10"}`}>
                {msg.sender_role === "admin" ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-accent" />}
              </div>
              <div className={`rounded-lg px-3 py-2 text-xs max-w-[75%] ${msg.sender_role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {msg.attachment_url && (
                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                    <img src={msg.attachment_url} alt="attachment" className="max-w-full rounded max-h-32 object-cover" />
                  </a>
                )}
                {msg.message !== "📎 Attachment" && <p className="whitespace-pre-line">{msg.message}</p>}
                <p className={`text-[10px] mt-1 ${msg.sender_role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input type="file" ref={fileRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="p-2 rounded-md hover:bg-secondary text-muted-foreground">
            {uploading ? <Paperclip className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={conversationStatus === "resolved" ? "Issue resolved. Send to reopen..." : "Type a message..."}
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={() => sendMessage()} className="bg-primary text-primary-foreground rounded-md p-2 hover:brightness-110 transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
