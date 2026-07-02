import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, Loader2, Sparkles, Trash2, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "KI-Chat – JDS Business AI" }] }),
  component: ChatPage,
});

interface Conv { id: string; title: string; updated_at: string; }
interface Attachment { name: string; type: string; size: number; dataUrl?: string; text?: string; }
interface Msg { id?: string; role: "user" | "assistant" | "system"; content: string; attachments?: Attachment[]; }

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_FILES = 5;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

function ChatPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

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

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    if (attachments.length + list.length > MAX_FILES) {
      toast.error(`Max. ${MAX_FILES} Dateien`);
      return;
    }
    const newOnes: Attachment[] = [];
    for (const f of list) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} ist zu groß (max 8 MB)`);
        continue;
      }
      try {
        if (f.type.startsWith("image/")) {
          const dataUrl = await readAsDataURL(f);
          newOnes.push({ name: f.name, type: f.type, size: f.size, dataUrl });
        } else if (
          f.type.startsWith("text/") ||
          f.type === "application/json" ||
          /\.(md|txt|csv|json|log|tsv|html|xml|yaml|yml)$/i.test(f.name)
        ) {
          const text = await readAsText(f);
          newOnes.push({ name: f.name, type: f.type || "text/plain", size: f.size, text });
        } else {
          // Other (PDF, docx, etc.) — send as note; AI cannot read raw binary here
          newOnes.push({ name: f.name, type: f.type || "application/octet-stream", size: f.size });
          toast.message(`${f.name}: nur Dateiname wird gesendet (Inhalt nicht lesbar)`);
        }
      } catch {
        toast.error(`${f.name} konnte nicht gelesen werden`);
      }
    }
    setAttachments([...attachments, ...newOnes]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (i: number) => setAttachments(attachments.filter((_, idx) => idx !== i));

  const send = async () => {
    if ((!input.trim() && attachments.length === 0) || !user) return;
    if (!profile || profile.credits <= 0) { toast.error(t("tool.no.credits")); return; }
    let convId = activeId;
    if (!convId) {
      const { data, error } = await supabase.from("chat_conversations")
        .insert({ user_id: user.id, title: (input || attachments[0]?.name || t("chat.new")).slice(0, 60) }).select().single();
      if (error) return toast.error(error.message);
      const c = data as Conv;
      setConvs([c, ...convs]);
      setActiveId(c.id);
      convId = c.id;
    } else if (messages.length === 0) {
      const title = (input || attachments[0]?.name || t("chat.new")).slice(0, 60);
      await supabase.from("chat_conversations").update({ title }).eq("id", convId);
      setConvs((prev) => prev.map((c) => c.id === convId ? { ...c, title } : c));
    }

    const userMsg: Msg = { role: "user", content: input.trim(), attachments: attachments.length ? attachments : undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachments([]);
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
                <div key={c.id} onClick={() => setActiveId(c.id)}
                  className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${activeId === c.id ? "bg-gold/10 text-gold" : "hover:bg-secondary"}`}>
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

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 380px)" }}>
              {messages.length === 0 && !sending ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="mb-3 h-10 w-10 text-gold/40" />
                  <p>{t("chat.empty")}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-gradient-gold text-gold-foreground" : "bg-secondary text-foreground"}`}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none
                            prose-headings:text-gold prose-headings:font-serif prose-headings:mt-3 prose-headings:mb-2
                            prose-p:my-2 prose-p:leading-relaxed
                            prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
                            prose-strong:text-gold prose-strong:font-semibold
                            prose-code:bg-background/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-gold prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-background/80 prose-pre:border prose-pre:border-border/40
                            prose-a:text-gold prose-a:underline
                            prose-table:text-xs prose-th:border prose-th:border-border/40 prose-th:bg-background/40 prose-th:p-2
                            prose-td:border prose-td:border-border/40 prose-td:p-2
                            prose-blockquote:border-l-gold prose-blockquote:text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{m.content || (m.attachments?.length ? "(siehe Anhang)" : "")}</div>
                        )}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.attachments.map((a, ai) => (
                              <div key={ai} className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${m.role === "user" ? "bg-gold-foreground/10" : "bg-background/60"}`}>
                                {a.type.startsWith("image/") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                <span className="max-w-[160px] truncate">{a.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary px-2 py-1 text-xs">
                      {a.type.startsWith("image/") && a.dataUrl ? (
                        <img src={a.dataUrl} alt={a.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <FileText className="h-4 w-4 text-gold" />
                      )}
                      <span className="max-w-[140px] truncate">{a.name}</span>
                      <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,text/*,.md,.txt,.csv,.json,.log,.html,.xml,.yaml,.yml,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Datei anhängen"
                  className="shrink-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={t("chat.placeholder")}
                  className="resize-none"
                />
                <Button onClick={send} disabled={sending || (!input.trim() && attachments.length === 0)} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Credit-Kosten je nach Länge & Anhängen (1–10) · Bilder & Textdateien werden analysiert · max 5 Dateien à 8 MB · Enter senden, Shift+Enter Zeilenumbruch
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
