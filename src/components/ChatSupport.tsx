import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const AUTO_REPLIES: Record<string, string> = {
  deposit: "To deposit funds, click the Deposit button in the menu or top bar. We support M-Pesa and Crypto deposits. For M-Pesa, enter your phone number and amount. For Crypto, select your preferred currency and send to the provided address.",
  withdraw: "To withdraw, go to Menu → Withdrawals. Enter the amount and your M-Pesa number. Withdrawals are processed within 24 hours.",
  bet: "To place a bet, select odds from any match, enter your stake in the bet slip, and click Place Bet. You can combine multiple selections for accumulator bets!",
  odds: "Our odds are powered by SharpAPI and update in real-time from 20+ sportsbooks. Click on any match to see detailed markets.",
  balance: "Your balance updates in real-time. Deposit via M-Pesa or Crypto to add funds. Check your transaction history for all activity.",
  help: "I can help with:\n• Deposits & Withdrawals\n• Placing bets\n• Account settings\n• Understanding odds\n\nJust type your question!",
  account: "Go to Menu → Settings to update your profile, change password, or manage notification preferences.",
  vip: "VIP program is coming soon! Stay tuned for exclusive bonuses and rewards.",
};

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(key)) return reply;
  }
  return "Thanks for your message! Our support team will get back to you shortly. In the meantime, try asking about deposits, withdrawals, bets, or account settings.";
}

const ChatSupport = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: "Hi! 👋 How can I help you today? Ask me about deposits, bets, withdrawals, or anything else!", sender: "bot", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input.trim(), sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: getBotReply(userMsg.text), sender: "bot", timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[100] bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:brightness-110 transition animate-in fade-in"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 max-h-[480px] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-primary rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary-foreground" />
          <div>
            <p className="text-sm font-bold text-primary-foreground">Support Chat</p>
            <p className="text-[10px] text-primary-foreground/70">Usually replies instantly</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px] max-h-[340px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "bot" ? "bg-primary/10" : "bg-accent/10"}`}>
              {msg.sender === "bot" ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-accent" />}
            </div>
            <div className={`rounded-lg px-3 py-2 text-xs max-w-[75%] whitespace-pre-line ${
              msg.sender === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={sendMessage} className="bg-primary text-primary-foreground rounded-md p-2 hover:brightness-110 transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
