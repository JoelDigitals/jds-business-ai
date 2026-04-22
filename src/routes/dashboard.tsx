import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, FileText, Shield, Scale, FileSignature, Sparkles, Download, Trash2, Ticket, MessageSquare } from "lucide-react";
import { downloadPdf } from "@/lib/pdf";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – AurumAI" }] }),
  component: Dashboard,
});

interface Doc {
  id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
}

function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("documents").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDocs(data as Doc[]);
    });
  }, [user]);

  const tools = [
    { icon: MessageSquare, key: "chat", to: "/chat" },
    { icon: Briefcase, key: "business", to: "/tools/business" },
    { icon: FileText, key: "imprint", to: "/tools/imprint" },
    { icon: Shield, key: "privacy", to: "/tools/privacy" },
    { icon: Scale, key: "legal", to: "/tools/legal" },
    { icon: FileSignature, key: "contract", to: "/tools/contract" },
  ] as const;

  const redeem = async () => {
    if (!code.trim()) return;
    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_code", { _code: code.trim().toUpperCase() });
    setRedeeming(false);
    if (error) return toast.error(error.message);
    const res = data as { success: boolean; error?: string; plan?: string; credits?: number };
    if (!res.success) return toast.error(res.error ?? "Fehler");
    toast.success(`Plan ${res.plan?.toUpperCase()} aktiviert! ${res.credits} Credits`);
    setCode("");
    await refreshProfile();
  };

  const deleteDoc = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id);
    setDocs(docs.filter((d) => d.id !== id));
    toast.success("Gelöscht");
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Top stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("dash.welcome")}</p>
              <p className="mt-2 text-2xl font-semibold truncate">{profile?.full_name || profile?.email}</p>
            </div>
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/10 to-transparent p-6 shadow-gold">
              <p className="text-xs uppercase tracking-wider text-gold">{t("dash.credits")}</p>
              <p className="mt-2 flex items-baseline gap-2 text-4xl font-bold text-gradient-gold">
                {profile?.credits ?? 0}
                <Sparkles className="h-5 w-5 text-gold" />
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("dash.plan")}</p>
              <p className="mt-2 text-2xl font-semibold uppercase">{profile?.plan}</p>
            </div>
          </div>

          {/* Code redeem */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-gold" />
              <h3 className="font-semibold">{t("dash.redeem")}</h3>
            </div>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("dash.redeem.placeholder")} />
              <Button onClick={redeem} disabled={redeeming} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                {redeeming ? "..." : t("dash.redeem.btn")}
              </Button>
            </div>
          </div>

          {/* Tools */}
          <h2 className="mt-12 text-2xl font-bold">{t("dash.tools")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link key={tool.key} to={tool.to} className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-gold/40 hover:shadow-gold">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  <tool.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{t(`feat.${tool.key}.title` as never)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`feat.${tool.key}.desc` as never)}</p>
              </Link>
            ))}
          </div>

          {/* Docs */}
          <h2 className="mt-12 text-2xl font-bold">{t("dash.docs")}</h2>
          {docs.length === 0 ? (
            <p className="mt-4 text-muted-foreground">{t("dash.no.docs")}</p>
          ) : (
            <div className="mt-6 space-y-3">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()} · {d.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(d.title, d.content, { documentId: d.id, toolType: d.type, legal: d.type !== "business" })}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteDoc(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
