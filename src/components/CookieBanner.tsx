import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Cookie, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "jds_cookie_consent_v2";
const OPEN_EVENT = "jds:open-cookie-settings";

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(c: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent("jds:consent-updated", { detail: c }));
}

export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) setVisible(true);
    else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
    const openHandler = () => {
      const c = getConsent();
      if (c) {
        setAnalytics(c.analytics);
        setMarketing(c.marketing);
      }
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_EVENT, openHandler);
  }, []);

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true, timestamp: new Date().toISOString() });
    setAnalytics(true);
    setMarketing(true);
    setVisible(false);
    setSettingsOpen(false);
  };

  const rejectAll = () => {
    saveConsent({ essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() });
    setAnalytics(false);
    setMarketing(false);
    setVisible(false);
    setSettingsOpen(false);
  };

  const saveCustom = () => {
    saveConsent({ essential: true, analytics, marketing, timestamp: new Date().toISOString() });
    setVisible(false);
    setSettingsOpen(false);
  };

  return (
    <>
      {visible && (
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
                Wir nutzen technisch notwendige Cookies für Login &amp; Sicherheit. Optional erlauben Sie
                anonyme Analyse und Marketing zur Verbesserung von JDS Business AI.{" "}
                <Link to="/legal/privacy" className="text-gold underline underline-offset-2">
                  Datenschutz
                </Link>
                .
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={acceptAll} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                  Alle akzeptieren
                </Button>
                <Button size="sm" variant="outline" onClick={rejectAll}>
                  Nur notwendige
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
                  <Settings2 className="h-3.5 w-3.5" /> Einstellungen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie-Einstellungen</DialogTitle>
            <DialogDescription>
              Wählen Sie, welche Kategorien Sie zulassen. Ihre Entscheidung können Sie jederzeit ändern.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div>
                <p className="font-medium">Notwendig</p>
                <p className="text-xs text-muted-foreground">
                  Login, Sicherheit, Cookie-Präferenz. Immer aktiv.
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div>
                <p className="font-medium">Analyse</p>
                <p className="text-xs text-muted-foreground">
                  Anonyme Nutzungsstatistiken zur Verbesserung der Plattform.
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div>
                <p className="font-medium">Marketing</p>
                <p className="text-xs text-muted-foreground">
                  Personalisierte Angebote und Retargeting.
                </p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={rejectAll}>Alle ablehnen</Button>
            <Button variant="outline" onClick={saveCustom}>Auswahl speichern</Button>
            <Button onClick={acceptAll} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              Alle akzeptieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
