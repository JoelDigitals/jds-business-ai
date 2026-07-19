import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout/Header";

export const Route = createFileRoute("/legal/imprint")({
  head: () => ({
    meta: [
      { title: "Impressum – Joel Digitals" },
      { name: "description", content: "Impressum von Joel Digitals gemäß § 5 TMG." },
    ],
  }),
  component: ImprintPage,
});

function ImprintPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
          <h1 className="text-4xl font-bold">Impressum</h1>
          <p className="mt-2 text-sm text-muted-foreground">Angaben gemäß § 5 TMG</p>

          <section className="mt-8 space-y-1">
            <p className="font-semibold">Joel Digitals</p>
            <p>Inhaber: Joel Nicolay</p>
            <p>Niederwiesstraße 20</p>
            <p>66822 Lebach</p>
            <p>Deutschland</p>
          </section>

          <h2 className="mt-8 text-2xl font-semibold">Kontakt</h2>
          <p className="mt-2">
            E-Mail:{" "}
            <a href="mailto:support@joel-digitals.com" className="text-gold hover:underline">
              support@joel-digitals.com
            </a>
            <br />
            Web:{" "}
            <a href="https://www.joel-digitals.de" target="_blank" rel="noreferrer" className="text-gold hover:underline">
              www.joel-digitals.de
            </a>
          </p>

          <h2 className="mt-8 text-2xl font-semibold">Umsatzsteuer-ID</h2>
          <p className="mt-2 text-muted-foreground">
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: wird nach Erteilung ergänzt.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">Redaktionell verantwortlich</h2>
          <p className="mt-2">Joel Schäfer (Anschrift wie oben)</p>

          <h2 className="mt-8 text-2xl font-semibold">EU-Streitschlichtung</h2>
          <p className="mt-2">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" className="text-gold hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>
            . Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">Verbraucherstreitbeilegung</h2>
          <p className="mt-2">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">Haftung für Inhalte</h2>
          <p className="mt-2 text-muted-foreground">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
            Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
            übermittelte oder gespeicherte fremde Informationen zu überwachen.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">Haftung für Links</h2>
          <p className="mt-2 text-muted-foreground">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">Urheberrecht</h2>
          <p className="mt-2 text-muted-foreground">
            Die durch den Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht.
            Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
            Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
