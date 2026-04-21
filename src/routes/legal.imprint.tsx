import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";

export const Route = createFileRoute("/legal/imprint")({
  head: () => ({ meta: [{ title: "Impressum – AurumAI" }] }),
  component: () => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-6 py-16 prose prose-invert">
          <h1 className="text-4xl font-bold">Impressum</h1>
          <p className="mt-6 text-muted-foreground">Angaben gemäß § 5 TMG</p>
          <p className="mt-4">AurumAI<br />Musterstraße 1<br />10115 Berlin<br />Deutschland</p>
          <p className="mt-4">Vertreten durch: Max Mustermann</p>
          <p className="mt-4"><strong>Kontakt</strong><br />E-Mail: kontakt@aurumai.example</p>
          <p className="mt-6 text-sm text-muted-foreground">Dies ist ein Beispiel-Impressum. Bitte ersetzen Sie es durch Ihre Daten.</p>
        </div>
      </main>
      <Footer />
    </div>
  ),
});
