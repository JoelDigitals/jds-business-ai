import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "jds_cookie_consent_v1";

type Consent = "accepted" | "essential" | null;

export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(STORAGE_KEY) as Consent) ?? null;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  const decide = (c: Exclude<Consent, null>) => {
    localStorage.setItem(STORAGE_KEY, c);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-Hinweis"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-gold/40 bg-card/95 p-4 shadow-gold backdrop-blur md:inset-x-auto md:right-6 md:bottom-6 md:left-auto"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground shadow-gold">
          <Cookie className="h-4 w-4" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-foreground">Wir verwenden Cookies</p>
          <p className="mt-1 text-muted-foreground">
            Wir nutzen technisch notwendige Cookies für Login &amp; Sicherheit. Mit "Alle akzeptieren"
            erlauben Sie zusätzlich anonyme Analyse zur Verbesserung von JDS Business AI.{" "}
            <Link to="/legal/privacy" className="text-gold underline underline-offset-2">
              Datenschutz
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => decide("accepted")}
              className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90"
            >
              Alle akzeptieren
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("essential")}>
              Nur notwendige
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
