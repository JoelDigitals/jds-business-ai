import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Anmelden – AurumAI" }] }),
  component: Login,
});

function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Eingeloggt!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-hero px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-elegant">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <Sparkles className="h-6 w-6 text-gold-foreground" />
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold">{t("auth.login.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.login.subtitle")}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              {loading ? "..." : t("auth.submit.login")}
            </Button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-gold">{t("auth.forgot")}</Link>
            <Link to="/register" className="text-muted-foreground hover:text-gold">{t("auth.no.account")}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
