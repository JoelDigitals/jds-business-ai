import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Nutzungsbedingungen – JDS Business AI" },
      { name: "description", content: "Allgemeine Geschäfts- und Nutzungsbedingungen für JDS Business AI." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
          <h1 className="text-4xl font-bold">Nutzungsbedingungen (AGB)</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stand: {new Date().toLocaleDateString("de-DE")}</p>

          <h2 className="mt-8 text-2xl font-semibold">§ 1 Geltungsbereich</h2>
          <p className="mt-2 text-muted-foreground">
            Diese Nutzungsbedingungen regeln die Nutzung der Plattform „JDS Business AI" (nachfolgend „Plattform"),
            betrieben von Joel Digitals, Inhaber Joel Schäfer.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 2 Leistungen</h2>
          <p className="mt-2 text-muted-foreground">
            Die Plattform stellt KI-gestützte Vorlagen und Werkzeuge zur Erstellung von Businessplänen, Impressum,
            Datenschutzerklärungen, Verträgen sowie einen allgemeinen KI-Chat bereit. Die Nutzung erfolgt über
            Credits im Rahmen des gewählten Plans (Free, Pro, Business).
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 3 Registrierung &amp; Konto</h2>
          <p className="mt-2 text-muted-foreground">
            Für die Nutzung ist eine Registrierung erforderlich. Nutzer sichern zu, wahrheitsgemäße Angaben zu machen
            und Zugangsdaten vertraulich zu behandeln. Ein Anspruch auf Registrierung besteht nicht.
          </p>

          <h2 className="mt-8 text-2xl function-semibold text-2xl font-semibold">§ 4 Preise, Codes &amp; Laufzeit</h2>
          <p className="mt-2 text-muted-foreground">
            Kostenpflichtige Pläne werden über Codes freigeschaltet, die im Shop unter joel-digitals.de erworben werden.
            Credits werden gemäß Plan monatlich zurückgesetzt. Bereits verbrauchte Credits werden nicht erstattet.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 5 Widerrufsrecht</h2>
          <p className="mt-2 text-muted-foreground">
            Verbraucher haben ein 14-tägiges Widerrufsrecht. Bei digitalen Inhalten (Code-Einlösung, KI-Generierungen)
            erlischt das Widerrufsrecht mit Beginn der Ausführung nach ausdrücklicher Zustimmung.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 6 Pflichten der Nutzer</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Keine rechtswidrigen, beleidigenden oder rechtsverletzenden Inhalte generieren.</li>
            <li>Keine automatisierte Massennutzung außerhalb der offiziellen API.</li>
            <li>Keine Umgehung der Credit- oder Sicherheitsmechanismen.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">§ 7 KI-Ergebnisse &amp; keine Rechtsberatung</h2>
          <p className="mt-2 text-muted-foreground">
            Ausgaben der KI sind Vorlagen und ersetzen keine individuelle Rechts-, Steuer- oder Unternehmensberatung.
            Nutzer prüfen Ergebnisse vor Verwendung eigenverantwortlich.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 8 Haftung</h2>
          <p className="mt-2 text-muted-foreground">
            Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach dem Produkthaftungsgesetz.
            Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt
            auf den vertragstypisch vorhersehbaren Schaden.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 9 Kündigung</h2>
          <p className="mt-2 text-muted-foreground">
            Nutzer können ihr Konto jederzeit über den Support löschen lassen. Wir können Konten bei Verstößen gegen
            diese Bedingungen sperren oder löschen.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">§ 10 Schlussbestimmungen</h2>
          <p className="mt-2 text-muted-foreground">
            Es gilt deutsches Recht. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen
            unberührt. Ergänzend gilt unsere{" "}
            <Link to="/legal/privacy" className="text-gold hover:underline">Datenschutzerklärung</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
