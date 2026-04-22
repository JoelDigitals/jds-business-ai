import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Rocket, Building2, Store, Code2, Briefcase, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/use-cases")({
  head: () => ({
    meta: [
      { title: "Anwendungsfälle – JDS Business AI" },
      { name: "description", content: "Vom Solo-Gründer bis zum Mittelstand – sehen Sie, wie JDS Business AI Ihren Alltag beschleunigt." },
      { property: "og:title", content: "Anwendungsfälle – JDS Business AI" },
      { property: "og:description", content: "Konkrete Use Cases: Gründung, Verträge, Compliance, Beratung." },
    ],
  }),
  component: UseCases,
});

function UseCases() {
  const cases = [
    { icon: Rocket, title: "Gründer & Startups", body: "Businessplan in 2 Minuten, Pitchdeck-Inhalte, Finanzplanung – alles für Ihre erste Investorenrunde." },
    { icon: Store, title: "Online-Shops", body: "DSGVO-Datenschutz, AGB, Widerrufsbelehrung und rechtssicheres Impressum auf Knopfdruck." },
    { icon: Code2, title: "Freelancer & Agenturen", body: "NDAs, Werkverträge, Auftragsverarbeitung – generieren, anpassen, downloaden." },
    { icon: Building2, title: "KMU & Mittelstand", body: "Internes Compliance-Wissen, Mitarbeiter-Vorlagen, schnelle Rechtseinschätzung für jeden Manager." },
    { icon: Briefcase, title: "Berater & Coaches", body: "Bereiten Sie Mandanten-Unterlagen schneller vor und nutzen Sie KI als Sparringspartner." },
    { icon: GraduationCap, title: "Bildung & Weiterbildung", body: "Trainingsmaterialien, Curriculum-Vorlagen und juristische Erklärungen für Ihre Lerngruppen." },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold md:text-6xl">
            Für jedes <span className="text-gradient-gold">Business</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Egal ob Sie alleine starten oder ein Team führen – JDS passt sich Ihrem Workflow an.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <div key={c.title} className="group rounded-2xl border border-border/60 bg-card p-8 transition-all hover:border-gold/40 hover:shadow-gold">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/register">Use Case starten</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
