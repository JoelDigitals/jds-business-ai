import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Kontakt – JDS Business AI" },
      { name: "description", content: "Fragen zu JDS Business AI? Schreiben Sie uns – wir antworten innerhalb von 24 Stunden." },
      { property: "og:title", content: "Kontakt – JDS Business AI" },
      { property: "og:description", content: "Nehmen Sie Kontakt mit dem JDS-Team auf." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Nachricht gesendet – wir melden uns!");
  };
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h1 className="text-5xl font-bold md:text-6xl">
                <span className="text-gradient-gold">Kontakt</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Wir helfen bei Fragen zu Plänen, Codes, Funktionen oder Rechtsthemen rund um die Plattform.
              </p>
              <div className="mt-10 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold"><Mail className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold">E-Mail</p>
                    <p className="text-sm text-muted-foreground">support@jds-business.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold"><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold">KI-Chat</p>
                    <p className="text-sm text-muted-foreground">Direkt im Dashboard verfügbar.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold"><Clock className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold">Antwortzeit</p>
                    <p className="text-sm text-muted-foreground">Innerhalb von 24 Stunden, Mo–Fr.</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-border/60 bg-card p-8">
              <h2 className="text-2xl font-semibold">Nachricht senden</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required disabled={sent} />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input id="email" type="email" required disabled={sent} />
                </div>
                <div>
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea id="message" rows={5} required disabled={sent} />
                </div>
                <Button type="submit" disabled={sent} className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                  {sent ? "Gesendet ✓" : "Senden"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
