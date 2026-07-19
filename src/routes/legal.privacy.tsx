import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/CookieBanner";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung – Joel Digitals" },
      { name: "description", content: "Datenschutzerklärung von Joel Digitals gemäß DSGVO." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
          <h1 className="text-4xl font-bold">Datenschutzerklärung</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stand: {new Date().toLocaleDateString("de-DE")}</p>

          <h2 className="mt-8 text-2xl font-semibold">1. Verantwortlicher</h2>
          <p className="mt-2">
            Joel Digitals, Inhaber Joel Nicolay, Niederwiesstraße 20, 66822 Lebach, Deutschland.
            <br />
            E-Mail:{" "}
            <a href="mailto:support@joel-digitals.com" className="text-gold hover:underline">
              support@joel-digitals.com
            </a>
          </p>

          <h2 className="mt-8 text-2xl font-semibold">2. Allgemeines zur Datenverarbeitung</h2>
          <p className="mt-2 text-muted-foreground">
            Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer
            funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist. Rechtsgrundlagen sind
            insbesondere Art. 6 Abs. 1 lit. a, b, c und f DSGVO.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">3. Server-Logfiles</h2>
          <p className="mt-2 text-muted-foreground">
            Bei jedem Aufruf werden automatisch technische Daten (IP-Adresse gekürzt, Datum/Uhrzeit, User-Agent, Referrer)
            erfasst, um Stabilität und Sicherheit zu gewährleisten. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            Speicherdauer: max. 14 Tage.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">4. Registrierung &amp; Nutzerkonto</h2>
          <p className="mt-2 text-muted-foreground">
            Für die Nutzung geschützter Funktionen erheben wir E-Mail-Adresse, Passwort (verschlüsselt), Name sowie
            gewählten Plan und Credit-Stand. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>

          <h2 className="mt-8 text-2xl font-semibold">5. KI-Verarbeitung</h2>
          <p className="mt-2 text-muted-foreground">
            Eingaben in KI-Tools (Chat, Dokumentengenerator) werden an unser KI-Gateway (Google Gemini, betrieben über
            Lovable AI Gateway) übermittelt, um Ausgaben zu erzeugen. Es findet kein Training auf Ihren Daten statt.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">6. Cookies &amp; lokaler Speicher</h2>
          <p className="mt-2 text-muted-foreground">
            Wir setzen technisch notwendige Cookies/localStorage-Einträge für Login, Sicherheit und Ihre
            Cookie-Präferenzen. Optionale Analyse-Cookies werden nur nach ausdrücklicher Einwilligung geladen
            (Art. 6 Abs. 1 lit. a DSGVO, § 25 TDDDG). Ihre Einwilligung können Sie jederzeit widerrufen:
          </p>
          <div className="mt-3">
            <Button onClick={openCookieSettings} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              Cookie-Einstellungen öffnen
            </Button>
          </div>

          <h2 className="mt-8 text-2xl font-semibold">7. Auftragsverarbeiter</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Supabase (Datenbank &amp; Auth) – EU-Region</li>
            <li>Lovable / Cloudflare (Hosting &amp; CDN)</li>
            <li>Google Gemini via Lovable AI Gateway (KI-Inferenz)</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">8. Ihre Rechte</h2>
          <p className="mt-2 text-muted-foreground">
            Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18),
            Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Beschwerderecht bei der zuständigen
            Aufsichtsbehörde. Anfragen bitte an{" "}
            <a href="mailto:support@joel-digitals.com" className="text-gold hover:underline">support@joel-digitals.com</a>.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">9. Speicherdauer</h2>
          <p className="mt-2 text-muted-foreground">
            Kontodaten bis zur Löschung des Kontos. Rechnungsrelevante Daten 10 Jahre (§ 147 AO).
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
