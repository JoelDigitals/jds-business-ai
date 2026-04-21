import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Plus, Copy, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin – AurumAI" }] }),
  component: Admin,
});

interface Code {
  id: string;
  code: string;
  plan: string;
  duration: string;
  uses: number;
  max_uses: number;
  expires_at: string | null;
  created_at: string;
}

function makeCode() {
  return Array.from({ length: 12 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
}

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [codes, setCodes] = useState<Code[]>([]);
  const [code, setCode] = useState(makeCode());
  const [plan, setPlan] = useState<"pro" | "business">("pro");
  const [duration, setDuration] = useState<"monthly" | "yearly">("monthly");
  const [maxUses, setMaxUses] = useState(1);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!isAdmin) { navigate({ to: "/dashboard" }); return; }
    load();
  }, [loading, user, isAdmin, navigate]);

  const load = async () => {
    const { data } = await supabase.from("redemption_codes").select("*").order("created_at", { ascending: false });
    if (data) setCodes(data as Code[]);
  };

  const create = async () => {
    const { error } = await supabase.from("redemption_codes").insert({
      code: code.toUpperCase(), plan, duration, max_uses: maxUses, created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Code erstellt!");
    setCode(makeCode());
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("redemption_codes").delete().eq("id", id);
    toast.success("Gelöscht");
    load();
  };

  const copy = (c: string) => {
    navigator.clipboard.writeText(c);
    toast.success("Kopiert!");
  };

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <Shield className="h-6 w-6 text-gold-foreground" />
            </div>
            <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          </div>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 font-semibold">{t("admin.create")}</h2>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <Label>{t("admin.code")}</Label>
                <div className="mt-1 flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                  <Button variant="outline" onClick={() => setCode(makeCode())}>↻</Button>
                </div>
              </div>
              <div>
                <Label>{t("admin.plan")}</Label>
                <select value={plan} onChange={(e) => setPlan(e.target.value as "pro" | "business")} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div>
                <Label>{t("admin.duration")}</Label>
                <select value={duration} onChange={(e) => setDuration(e.target.value as "monthly" | "yearly")} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="monthly">Monatlich</option>
                  <option value="yearly">Jährlich</option>
                </select>
              </div>
              <div>
                <Label>Max</Label>
                <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)} className="mt-1" />
              </div>
            </div>
            <Button onClick={create} className="mt-4 bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Plus className="h-4 w-4" /> {t("admin.generate")}
            </Button>
          </div>

          <h2 className="mt-10 font-semibold">{t("admin.list")} ({codes.length})</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{t("admin.code")}</th>
                  <th className="p-3 text-left">{t("admin.plan")}</th>
                  <th className="p-3 text-left">{t("admin.duration")}</th>
                  <th className="p-3 text-left">{t("admin.uses")}</th>
                  <th className="p-3 text-left">{t("admin.created")}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-t border-border/40">
                    <td className="p-3 font-mono text-gold">{c.code}</td>
                    <td className="p-3 uppercase">{c.plan}</td>
                    <td className="p-3">{c.duration}</td>
                    <td className="p-3">{c.uses}/{c.max_uses}</td>
                    <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copy(c.code)}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Noch keine Codes erstellt.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Hinweis: Um einen Admin-Account zu erstellen, fügen Sie über das Cloud-Dashboard manuell eine Zeile in <code className="text-gold">user_roles</code> ein mit role=<code className="text-gold">admin</code>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
