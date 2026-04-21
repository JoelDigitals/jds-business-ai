import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Datenschutz – AurumAI" }] }),
  component: () => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-bold">Datenschutzerklärung</h1>
          <p className="mt-6 text-muted-foreground">Wir nehmen den Schutz Ihrer Daten ernst. Diese Beispiel-Datenschutzerklärung dient nur Demonstrationszwecken.</p>
          <h2 className="mt-8 text-2xl font-semibold">Verantwortlicher</h2>
          <p className="mt-2">AurumAI, Musterstraße 1, 10115 Berlin</p>
          <h2 className="mt-8 text-2xl font-semibold">Daten, die wir verarbeiten</h2>
          <p className="mt-2">E-Mail-Adresse, Name (für Konto), Inhalte Ihrer Dokumente.</p>
          <h2 className="mt-8 text-2xl font-semibold">Ihre Rechte</h2>
          <p className="mt-2">Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch gemäß DSGVO Art. 15-22.</p>
        </div>
      </main>
      <Footer />
    </div>
  ),
});
