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
import { Shield, Plus, Copy, Trash2, KeyRound, Code as CodeIcon } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin – JDS Business AI" }] }),
  component: Admin,
});

interface Code {
  id: string; code: string; plan: string; duration: string;
  uses: number; max_uses: number; expires_at: string | null; created_at: string;
}
interface ApiKey {
  id: string; label: string; key_prefix: string; revoked: boolean;
  usage_count: number; last_used_at: string | null; created_at: string;
}

function makeCode() {
  return Array.from({ length: 12 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
}
function makeApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(40))).map((b) => chars[b % chars.length]).join("");
  return `jds_live_${rand}`;
}
async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const API_BASE = `${SUPABASE_URL}/functions/v1/public-api`;

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [codes, setCodes] = useState<Code[]>([]);
  const [code, setCode] = useState(makeCode());
  const [plan, setPlan] = useState<"pro" | "business">("pro");
  const [duration, setDuration] = useState<"monthly" | "yearly">("monthly");
  const [maxUses, setMaxUses] = useState(1);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keyLabel, setKeyLabel] = useState("JDS Management");
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!isAdmin) { navigate({ to: "/dashboard" }); return; }
    load();
  }, [loading, user, isAdmin, navigate]);

  const load = async () => {
    const [{ data: c }, { data: k }] = await Promise.all([
      supabase.from("redemption_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
    ]);
    if (c) setCodes(c as Code[]);
    if (k) setApiKeys(k as ApiKey[]);
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

  const createApiKey = async () => {
    if (!keyLabel.trim()) return toast.error("Bezeichnung erforderlich");
    const raw = makeApiKey();
    const hash = await sha256(raw);
    const { error } = await supabase.from("api_keys").insert({
      user_id: user!.id, label: keyLabel.trim(), key_prefix: raw.slice(0, 16), key_hash: hash,
    });
    if (error) return toast.error(error.message);
    setNewKey(raw);
    setKeyLabel("JDS Management");
    load();
  };

  const revokeKey = async (id: string) => {
    await supabase.from("api_keys").update({ revoked: true }).eq("id", id);
    toast.success("API Key widerrufen");
    load();
  };
  const deleteKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    toast.success("Gelöscht");
    load();
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

          {/* Codes section */}
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

          {/* API Keys section */}
          <div className="mt-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <KeyRound className="h-5 w-5 text-gold-foreground" />
            </div>
            <h2 className="text-2xl font-bold">API Keys (unbegrenzt)</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Für die Integration in JDS Management. Diese Keys umgehen das Credit-Limit und können den Chat und die Dokumenten-Erstellung extern aufrufen.
          </p>

          <div className="mt-4 rounded-2xl border border-border/60 bg-card p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <Label>Bezeichnung</Label>
                <Input value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} className="mt-1" placeholder="z. B. JDS Management Production" />
              </div>
              <div className="flex items-end">
                <Button onClick={createApiKey} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                  <Plus className="h-4 w-4" /> Neuen API Key erstellen
                </Button>
              </div>
            </div>

            {newKey && (
              <div className="mt-4 rounded-lg border border-gold/50 bg-gold/10 p-4">
                <div className="text-sm font-semibold text-gold">⚠️ Key nur jetzt sichtbar – sicher speichern!</div>
                <div className="mt-2 flex gap-2">
                  <code className="flex-1 break-all rounded bg-background px-3 py-2 font-mono text-xs">{newKey}</code>
                  <Button size="sm" variant="outline" onClick={() => { copy(newKey); }}>
                    <Copy className="h-3.5 w-3.5" /> Kopieren
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setNewKey(null)}>Schließen</Button>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Bezeichnung</th>
                  <th className="p-3 text-left">Prefix</th>
                  <th className="p-3 text-left">Aufrufe</th>
                  <th className="p-3 text-left">Zuletzt verwendet</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-t border-border/40">
                    <td className="p-3">{k.label}</td>
                    <td className="p-3 font-mono text-gold">{k.key_prefix}…</td>
                    <td className="p-3">{k.usage_count}</td>
                    <td className="p-3 text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}</td>
                    <td className="p-3">{k.revoked ? <span className="text-destructive">widerrufen</span> : <span className="text-green-500">aktiv</span>}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {!k.revoked && <Button size="sm" variant="ghost" onClick={() => revokeKey(k.id)}>Widerrufen</Button>}
                        <Button size="sm" variant="ghost" onClick={() => deleteKey(k.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Noch keine API Keys.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Docs */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-2">
              <CodeIcon className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-bold">API Dokumentation</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Authentifizierung: Header <code className="text-gold">Authorization: Bearer DEIN_API_KEY</code> oder <code className="text-gold">x-api-key: DEIN_API_KEY</code>.
              Keine Credit-Limits.
            </p>

            <div className="mt-4">
              <div className="text-sm font-semibold">1. Chat (allgemein) — <span className="text-gold">POST</span></div>
              <code className="mt-1 block break-all rounded bg-background px-3 py-2 font-mono text-xs">{API_BASE}/chat</code>
              <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-xs"><code>{`{
  "messages": [
    { "role": "user", "content": "Erkläre mir GbR vs UG" }
  ],
  "lang": "de",
  "model": "google/gemini-2.5-flash"
}`}</code></pre>
              <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-xs"><code>{`curl -X POST "${API_BASE}/chat" \\
  -H "Authorization: Bearer DEIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Hallo"}]}'`}</code></pre>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">2. Dokument erstellen — <span className="text-gold">POST</span></div>
              <code className="mt-1 block break-all rounded bg-background px-3 py-2 font-mono text-xs">{API_BASE}/document</code>
              <p className="mt-1 text-xs text-muted-foreground">
                Tools: <code>business</code>, <code>imprint</code>, <code>privacy</code>, <code>legal</code>, <code>contract</code>
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-xs"><code>{`{
  "tool": "contract",
  "title": "NDA mit Acme",
  "lang": "de",
  "input": {
    "contractType": "NDA",
    "parties": "JDS GmbH und Acme Ltd",
    "details": "Gegenseitige Vertraulichkeit, 3 Jahre"
  }
}`}</code></pre>
              <p className="mt-2 text-xs text-muted-foreground">
                Antwort: <code>{`{ "content": "...markdown...", "documentId": "uuid" }`}</code>
              </p>
            </div>
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
