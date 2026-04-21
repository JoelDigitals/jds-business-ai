import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { useI18n } from "@/lib/i18n";
import { Briefcase, FileText, Shield, Scale, FileSignature, Download } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Funktionen – AurumAI" },
      { name: "description", content: "Alle KI-Tools für Ihr Business: Businessplan, Impressum, Datenschutz, Verträge und mehr." },
    ],
  }),
  component: Features,
});

function Features() {
  const { t } = useI18n();
  const items = [
    { icon: Briefcase, key: "business" },
    { icon: FileText, key: "imprint" },
    { icon: Shield, key: "privacy" },
    { icon: Scale, key: "legal" },
    { icon: FileSignature, key: "contract" },
    { icon: Download, key: "pdf" },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl font-bold md:text-6xl">
              <span className="text-gradient-gold">{t("features.title")}</span>
            </h1>
            <p className="mt-4 text-muted-foreground">{t("features.subtitle")}</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {items.map((f) => (
              <div key={f.key} className="rounded-2xl border border-border/60 bg-card p-8 hover:border-gold/40 transition-all">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground shadow-gold">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-semibold">{t(`feat.${f.key}.title` as never)}</h3>
                <p className="mt-3 text-muted-foreground">{t(`feat.${f.key}.desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
