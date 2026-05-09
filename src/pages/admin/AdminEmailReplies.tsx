import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Reply {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string | null;
  subject: string | null;
  text_body: string | null;
  html_body: string | null;
  is_read: boolean;
  forwarded_at: string | null;
  created_at: string;
  matched_user_id: string | null;
}

const AdminEmailReplies = () => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [selected, setSelected] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_replies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setReplies((data as Reply[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("email_replies_admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "email_replies" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const markRead = async (r: Reply) => {
    if (r.is_read) return;
    await supabase.from("email_replies").update({ is_read: true }).eq("id", r.id);
    setReplies((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_read: true } : x)));
  };

  const unreadCount = replies.filter((r) => !r.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Email Replies</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread • Replies sent to <code>replies@inbox.betking.space</code>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        <Card className="p-2 max-h-[70vh] overflow-y-auto">
          {replies.length === 0 && !loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No replies yet. Once SendGrid Inbound Parse is configured, customer replies will appear here.
            </div>
          )}
          {replies.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelected(r); markRead(r); }}
              className={`w-full text-left p-3 rounded-md mb-1 transition border ${
                selected?.id === r.id
                  ? "bg-primary/10 border-primary/30"
                  : "border-transparent hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-sm truncate ${r.is_read ? "" : "font-bold"}`}>
                  {r.from_name || r.from_email}
                </span>
                {!r.is_read && <Badge variant="default" className="text-xs">New</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">{r.subject || "(no subject)"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </div>
            </button>
          ))}
        </Card>

        <Card className="p-6">
          {!selected ? (
            <div className="text-center text-muted-foreground py-12">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Select a reply to read it
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.subject || "(no subject)"}</h2>
                <div className="text-sm text-muted-foreground mt-1">
                  From <span className="font-medium text-foreground">{selected.from_name || selected.from_email}</span>{" "}
                  &lt;{selected.from_email}&gt;
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(selected.created_at).toLocaleString()} •{" "}
                  {selected.forwarded_at ? (
                    <span className="text-green-500">Forwarded to your email</span>
                  ) : (
                    <span>Stored only</span>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                {selected.html_body ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selected.html_body }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans">{selected.text_body || "(empty)"}</pre>
                )}
              </div>

              <div className="border-t pt-4">
                <a
                  href={`mailto:${selected.from_email}?subject=${encodeURIComponent("Re: " + (selected.subject || ""))}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  <MailOpen className="w-4 h-4" /> Reply via your email client
                </a>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminEmailReplies;
