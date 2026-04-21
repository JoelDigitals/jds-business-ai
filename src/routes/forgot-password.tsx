import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Passwort vergessen – AurumAI" }] }),
  component: Forgot,
});

function Forgot() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("E-Mail gesendet!");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-hero px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-elegant">
          <h1 className="text-center text-3xl font-bold">{t("auth.reset.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.reset.subtitle")}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              {loading ? "..." : t("auth.reset.submit")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-gold">← {t("nav.login")}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
