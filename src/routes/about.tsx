import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Über uns – JDS Business AI" },
      { name: "description", content: "JDS Business AI – Premium KI-Plattform für Unternehmer, Selbstständige und Teams." },
      { property: "og:title", content: "Über uns – JDS Business AI" },
      { property: "og:description", content: "Lernen Sie das Team und die Mission hinter JDS Business AI kennen." },
    ],
  }),
  component: About,
});

function About() {
  const values = [
    { icon: Target, title: "Mission", body: "Jeder Unternehmer verdient Zugang zu erstklassiger Business-Intelligenz – ohne Anwalts- oder Beraterkosten." },
    { icon: Shield, title: "Vertrauen", body: "DSGVO-konform, deutsche Server, keine Datenweitergabe. Ihre Eingaben gehören Ihnen." },
    { icon: Zap, title: "Geschwindigkeit", body: "Was früher Tage dauerte, erledigt JDS in Sekunden – ohne Qualitätsverlust." },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold">
            <Sparkles className="h-3 w-3" /> Über JDS
          </div>
          <h1 className="text-5xl font-bold md:text-6xl">
            <span className="text-gradient-gold">Premium KI</span> für ernsthafte Unternehmer
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            JDS Business AI vereint juristische Präzision, unternehmerische Klarheit und modernste KI – in einer eleganten Plattform.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border/60 bg-card p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/5 to-transparent p-12 text-center shadow-elegant">
            <h2 className="text-3xl font-bold">Bereit, mit JDS zu starten?</h2>
            <p className="mt-4 text-muted-foreground">5 kostenlose Credits. Keine Kreditkarte.</p>
            <Button asChild size="lg" className="mt-8 bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/register">Jetzt kostenlos starten</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
