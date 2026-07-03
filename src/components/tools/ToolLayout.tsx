import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Download, Sparkles, Loader2, ThumbsUp, ThumbsDown, Flag, AlertTriangle } from "lucide-react";
import { downloadPdf } from "@/lib/pdf";

export type ToolKey = "business" | "imprint" | "privacy" | "legal" | "contract";

const TOOL_COST: Record<ToolKey, number> = {
  business: 5,
  contract: 4,
  privacy: 3,
  imprint: 2,
  legal: 2,
};

interface Props {
  toolKey: ToolKey;
  title: string;
  buildTitle: (input: Record<string, string>) => string;
  children: (input: Record<string, string>, set: (k: string, v: string) => void) => ReactNode;
  initial: Record<string, string>;
  legal?: boolean;
}

export function ToolLayout({ toolKey, title, buildTitle, children, initial, legal = true }: Props) {
  const { t, lang } = useI18n();
  const { user, profile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState<Record<string, string>>(initial);
  const [content, setContent] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [rated, setRated] = useState<null | 1 | -1>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  if (!loading && !user) {
    navigate({ to: "/login" });
    return null;
  }

  const set = (k: string, v: string) => setInput((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!profile || profile.credits <= 0) {
      toast.error(t("tool.no.credits"));
      return;
    }
    setGenerating(true);
    setContent("");
    setDocId(null);
    setRated(null);
    const docTitle = buildTitle(input);
    const { data, error } = await supabase.functions.invoke("generate", {
      body: { tool: toolKey, lang, input, title: docTitle },
    });
    setGenerating(false);
    if (error) {
      toast.error(error.message || "Fehler");
      return;
    }
    const res = data as { error?: string; content?: string; documentId?: string };
    if (res.error === "no_credits") return toast.error(t("tool.no.credits"));
    if (res.error) return toast.error(res.error);
    setContent(res.content ?? "");
    setDocId(res.documentId ?? null);
    await refreshProfile();
    toast.success("Generiert!");
  };

  const docTitle = buildTitle(input);

  const rate = async (rating: 1 | -1) => {
    if (!user || rated) return;
    setRated(rating);
    const { error } = await supabase.from("tool_feedback").insert({
      user_id: user.id,
      document_id: docId,
      tool: toolKey,
      rating,
    });
    if (error) {
      setRated(null);
      toast.error(error.message);
      return;
    }
    toast.success(t("tool.feedback.thanks"));
  };

  const sendReport = async () => {
    if (!user || !reportMsg.trim()) return;
    setSendingReport(true);
    const { error } = await supabase.from("tool_reports").insert({
      user_id: user.id,
      document_id: docId,
      tool: toolKey,
      message: reportMsg.trim(),
      input,
    });
    setSendingReport(false);
    if (error) return toast.error(error.message);
    toast.success(t("tool.report.sent"));
    setReportMsg("");
    setReportOpen(false);
  };

  const download = () => {
    const id = downloadPdf(docTitle, content, {
      documentId: docId ?? undefined,
      toolType: toolKey,
      legal,
    });
    if (!docId) setDocId(id);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> {t("tool.back")}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <Sparkles className="h-6 w-6 text-gold-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">Credits: <span className="text-gold">{profile?.credits ?? 0}</span></p>
            </div>
          </div>

          {legal && (
            <div className="mt-6 flex gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-gold" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">{t("tool.legal.banner.title")}</p>
                <p className="mt-1 text-muted-foreground">{t("tool.legal.banner.body")}</p>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="space-y-4">{children(input, set)}</div>
              <Button onClick={generate} disabled={generating} className="mt-6 w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("tool.generating")}</>
                ) : (
                  <><Sparkles className="h-4 w-4" />{t("tool.generate")} (1 Credit)</>
                )}
              </Button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              {content ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">Ergebnis</h3>
                      {docId && (
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("tool.docId")}: <span className="font-mono text-gold">{docId.replace(/-/g, "").slice(0, 12).toUpperCase()}</span>
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={download} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                      <Download className="h-4 w-4" /> {t("tool.download")}
                    </Button>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-background/50 p-4 text-sm leading-relaxed">
                    {content}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Bewertung:</span>
                      <Button
                        size="sm"
                        variant={rated === 1 ? "default" : "outline"}
                        onClick={() => rate(1)}
                        disabled={!!rated}
                        className={rated === 1 ? "bg-gradient-gold text-gold-foreground" : ""}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("tool.feedback.helpful")}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={rated === -1 ? "default" : "outline"}
                        onClick={() => rate(-1)}
                        disabled={!!rated}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("tool.feedback.notHelpful")}</span>
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setReportOpen(true)} className="text-muted-foreground hover:text-destructive">
                      <Flag className="h-3.5 w-3.5" /> {t("tool.report.btn")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="mb-3 h-8 w-8 text-gold/40" />
                  <p className="text-sm">Füllen Sie das Formular aus und klicken Sie auf Generieren.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tool.report.title")}</DialogTitle>
            <DialogDescription>{t("tool.report.desc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={reportMsg}
            onChange={(e) => setReportMsg(e.target.value)}
            placeholder={t("tool.report.placeholder")}
          />
          {docId && (
            <p className="text-xs text-muted-foreground">
              {t("tool.docId")}: <span className="font-mono text-gold">{docId.replace(/-/g, "").slice(0, 12).toUpperCase()}</span>
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Abbrechen</Button>
            <Button onClick={sendReport} disabled={sendingReport || !reportMsg.trim()} className="bg-gradient-gold text-gold-foreground">
              {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} {t("tool.report.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
