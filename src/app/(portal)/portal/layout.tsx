import { Mountain } from "lucide-react";
import Link from "next/link";
import { getLocale } from "./_i18n/get-locale";
import { getDictionary, t } from "./_i18n";
import { LanguageSwitcher } from "./_components/language-switcher";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="border-b border-warm-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
              <Mountain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-warm-900">{t(dict, "header.brand")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <p className="hidden sm:block text-sm text-warm-500">{t(dict, "header.clientPortal")}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-warm-200 bg-white py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-warm-400">
          <p>&copy; {new Date().getFullYear()} Tour Manager. {t(dict, "footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
