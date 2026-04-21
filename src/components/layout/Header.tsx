import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, LogOut, Shield } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <Sparkles className="h-4 w-4 text-gold-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-gradient-gold">Aurum</span>AI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("nav.features")}
          </Link>
          <Link to="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("nav.pricing")}
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.dashboard")}
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 text-sm text-gold transition-colors hover:text-gold-muted">
              <Shield className="h-3.5 w-3.5" />
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang.toUpperCase()}
          </button>

          {user ? (
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/40 py-10 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span>© {new Date().getFullYear()} AurumAI. {t("footer.rights")}</span>
        </div>
        <div className="flex gap-6">
          <Link to="/legal/imprint" className="hover:text-foreground">{t("footer.imprint")}</Link>
          <Link to="/legal/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link>
        </div>
      </div>
    </footer>
  );
}
