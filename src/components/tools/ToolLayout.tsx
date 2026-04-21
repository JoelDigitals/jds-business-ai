import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Download, Sparkles, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf";

export type ToolKey = "business" | "imprint" | "privacy" | "legal" | "contract";

interface Props {
  toolKey: ToolKey;
  title: string;
  buildTitle: (input: Record<string, string>) => string;
  children: (input: Record<string, string>, set: (k: string, v: string) => void) => ReactNode;
  initial: Record<string, string>;
}

export function ToolLayout({ toolKey, title, buildTitle, children, initial }: Props) {
  const { t, lang } = useI18n();
  const { user, profile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState<Record<string, string>>(initial);
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);

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
    const docTitle = buildTitle(input);
    const { data, error } = await supabase.functions.invoke("generate", {
      body: { tool: toolKey, lang, input, title: docTitle },
    });
    setGenerating(false);
    if (error) {
      toast.error(error.message || "Fehler");
      return;
    }
    if ((data as { error?: string }).error === "no_credits") {
      toast.error(t("tool.no.credits"));
      return;
    }
    if ((data as { error?: string }).error) {
      toast.error((data as { error: string }).error);
      return;
    }
    setContent((data as { content: string }).content);
    await refreshProfile();
    toast.success("Generiert!");
  };

  const docTitle = buildTitle(input);

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
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Ergebnis</h3>
                    <Button size="sm" onClick={() => downloadPdf(docTitle, content)} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                      <Download className="h-4 w-4" /> {t("tool.download")}
                    </Button>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-background/50 p-4 text-sm leading-relaxed">
                    {content}
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
    </div>
  );
}
