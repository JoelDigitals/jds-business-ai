import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Sparkles, FileText, Shield, Scale, FileSignature, Download, Briefcase, ArrowRight, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JDS Business AI – Ihr KI Business-Assistent" },
      { name: "description", content: "Businesspläne, Verträge, Impressum, Datenschutz, KI-Chat und Rechtsberatung per KI." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const features = [
    { icon: Briefcase, key: "business" as const },
    { icon: FileText, key: "imprint" as const },
    { icon: Shield, key: "privacy" as const },
    { icon: Scale, key: "legal" as const },
    { icon: FileSignature, key: "contract" as const },
    { icon: Download, key: "pdf" as const },
    { icon: MessageSquare, key: "chat" as const },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold">
            <Sparkles className="h-3 w-3" />
            {t("hero.badge")}
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] md:text-7xl">
            <span className="text-gradient-gold">JDS</span> Business AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/register">
                {t("hero.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-gold/30 hover:bg-gold/5">
              <Link to="/pricing">{t("hero.cta2")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold md:text-5xl">{t("features.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("features.subtitle")}</p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.key} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 transition-all hover:border-gold/40 hover:shadow-gold">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-all group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{t(`feat.${f.key}.title` as never)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`feat.${f.key}.desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/5 to-transparent p-12 shadow-elegant">
            <Sparkles className="mx-auto mb-4 h-8 w-8 text-gold" />
            <h2 className="text-3xl font-bold md:text-4xl">{t("hero.title")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("hero.subtitle")}</p>
            <Button asChild size="lg" className="mt-8 bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/register">{t("hero.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
