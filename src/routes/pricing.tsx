import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Preise – AurumAI" },
      { name: "description", content: "Free, Pro und Business Pläne. Monatlich oder jährlich per Code aktivierbar." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { t } = useI18n();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      key: "free",
      price: "0",
      credits: t("pricing.credits.free"),
      features: [t("pricing.feature.all"), t("pricing.feature.pdf")],
      cta: t("pricing.cta.free"),
      highlight: false,
    },
    {
      key: "pro",
      price: billing === "monthly" ? "29" : "290",
      credits: t("pricing.credits.pro"),
      features: [t("pricing.feature.all"), t("pricing.feature.pdf"), t("pricing.feature.history"), t("pricing.feature.support")],
      cta: t("pricing.cta.paid"),
      highlight: true,
    },
    {
      key: "business",
      price: billing === "monthly" ? "79" : "790",
      credits: t("pricing.credits.business"),
      features: [t("pricing.feature.all"), t("pricing.feature.pdf"), t("pricing.feature.history"), t("pricing.feature.priority")],
      cta: t("pricing.cta.paid"),
      highlight: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl font-bold md:text-6xl">
              <span className="text-gradient-gold">{t("pricing.title")}</span>
            </h1>
            <p className="mt-4 text-muted-foreground">{t("pricing.subtitle")}</p>

            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === "monthly" ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === "yearly" ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("pricing.yearly")} <span className="text-xs opacity-70">−20%</span>
              </button>
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.key}
                className={`relative flex flex-col rounded-2xl border p-8 ${p.highlight ? "border-gold bg-gradient-to-b from-gold/10 to-transparent shadow-gold" : "border-border/60 bg-card"}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold text-gold-foreground shadow-gold">
                    <Sparkles className="h-3 w-3" /> Beliebt
                  </div>
                )}
                <h3 className="text-2xl font-semibold">{t(`pricing.${p.key}.name` as never)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.${p.key}.desc` as never)}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">€{p.price}</span>
                  <span className="text-sm text-muted-foreground">/{billing === "monthly" ? "mo" : "yr"}</span>
                </div>
                <p className="mt-2 text-sm text-gold">{p.credits}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-gold" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className={`mt-8 ${p.highlight ? "bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" : ""}`} variant={p.highlight ? "default" : "outline"}>
                  <Link to="/register">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            ✦ {t("pricing.code.label")}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
