import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Neues Passwort – AurumAI" }] }),
  component: Reset,
});

function Reset() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Passwort aktualisiert!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-hero px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-elegant">
          <h1 className="text-center text-3xl font-bold">{t("auth.reset.new")}</h1>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="pw">{t("auth.password")}</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              {loading ? "..." : t("auth.reset.new")}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
