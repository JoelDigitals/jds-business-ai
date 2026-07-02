import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/CookieBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground shadow-gold hover:opacity-90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JDS Business AI – Ihr KI Business-Assistent" },
      { name: "description", content: "Businesspläne, Verträge, Impressum, Datenschutz, KI-Chat und Rechtsberatung per KI – alles in einer Premium-Plattform." },
      { property: "og:title", content: "JDS Business AI – Ihr KI Business-Assistent" },
      { property: "og:description", content: "Businesspläne, Verträge, Impressum, Datenschutz, KI-Chat und Rechtsberatung per KI – alles in einer Premium-Plattform." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "JDS Business AI – Ihr KI Business-Assistent" },
      { name: "twitter:description", content: "Businesspläne, Verträge, Impressum, Datenschutz, KI-Chat und Rechtsberatung per KI – alles in einer Premium-Plattform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9049881d-1945-4555-8d6f-93f150413fc4/id-preview-efb2fea3--444ce8f0-afbf-49f9-8c9f-bde08ca4c8fc.lovable.app-1776842501010.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9049881d-1945-4555-8d6f-93f150413fc4/id-preview-efb2fea3--444ce8f0-afbf-49f9-8c9f-bde08ca4c8fc.lovable.app-1776842501010.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" />
        <CookieBanner />
      </AuthProvider>
    </I18nProvider>
  );
}
