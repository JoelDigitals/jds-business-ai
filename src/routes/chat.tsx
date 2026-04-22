import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, Loader2, Sparkles, Trash2 } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "KI-Chat – JDS Business AI" }] }),
  component: ChatPage,
});

interface Conv { id: string; title: string; updated_at: string; }
interface Msg { id?: string; role: "user" | "assistant" | "system"; content: string; }

function ChatPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_conversations").select("*").order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setConvs(data as Conv[]);
    });
  }, [user]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    supabase.from("chat_messages").select("*").eq("conversation_id", activeId).order("created_at").then(({ data }) => {
      if (data) setMessages(data as Msg[]);
    });
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const newChat = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("chat_conversations")
      .insert({ user_id: user.id, title: t("chat.new") }).select().single();
    if (error) return toast.error(error.message);
    const c = data as Conv;
    setConvs([c, ...convs]);
    setActiveId(c.id);
    setMessages([]);
  };

  const deleteConv = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConvs(convs.filter((c) => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const send = async () => {
    if (!input.trim() || !user) return;
    if (!profile || profile.credits <= 0) {
      toast.error(t("tool.no.credits"));
      return;
    }
    let convId = activeId;
    if (!convId) {
      const { data, error } = await supabase.from("chat_conversations")
        .insert({ user_id: user.id, title: input.slice(0, 60) }).select().single();
      if (error) return toast.error(error.message);
      const c = data as Conv;
      setConvs([c, ...convs]);
      setActiveId(c.id);
      convId = c.id;
    } else if (messages.length === 0) {
      await supabase.from("chat_conversations").update({ title: input.slice(0, 60) }).eq("id", convId);
      setConvs((prev) => prev.map((c) => c.id === convId ? { ...c, title: input.slice(0, 60) } : c));
    }

    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    const { data, error } = await supabase.functions.invoke("chat", {
      body: { conversationId: convId, messages: next, lang },
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    const res = data as { error?: string; content?: string };
    if (res.error === "no_credits") return toast.error(t("tool.no.credits"));
    if (res.error) return toast.error(res.error);
    setMessages([...next, { role: "assistant", content: res.content ?? "" }]);
    await refreshProfile();
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[280px_1fr]" style={{ minHeight: "calc(100vh - 160px)" }}>
          {/* Sidebar */}
          <aside className="rounded-2xl border border-border/60 bg-card p-4">
            <Button onClick={newChat} className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Plus className="h-4 w-4" /> {t("chat.new")}
            </Button>
            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{t("chat.history")}</p>
            <div className="mt-2 space-y-1">
              {convs.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${activeId === c.id ? "bg-gold/10 text-gold" : "hover:bg-secondary"}`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }} className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
              {convs.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">—</p>}
            </div>
          </aside>

          {/* Chat */}
          <section className="flex flex-col rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                  <Sparkles className="h-4 w-4 text-gold-foreground" />
                </div>
                <div>
                  <h1 className="font-semibold">{t("chat.title")}</h1>
                  <p className="text-xs text-muted-foreground">{t("chat.subtitle")}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Credits: <span className="text-gold">{profile?.credits ?? 0}</span></p>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 360px)" }}>
              {messages.length === 0 && !sending ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="mb-3 h-10 w-10 text-gold/40" />
                  <p>{t("chat.empty")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-gradient-gold text-gold-foreground" : "bg-secondary text-foreground"}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-gold" /> {t("chat.thinking")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border/40 p-4">
              <div className="flex gap-2">
                <Textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  placeholder={t("chat.placeholder")}
                  className="resize-none"
                />
                <Button onClick={send} disabled={sending || !input.trim()} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">1 Credit pro Antwort. Enter zum Senden, Shift+Enter für Zeilenumbruch.</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
