"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { type Locale, LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from "../_i18n";

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(locale: Locale) {
    document.cookie = `portal-locale=${locale};path=/portal;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-warm-600 hover:bg-warm-100 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span>{LOCALE_FLAGS[currentLocale]} {currentLocale.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-warm-200 bg-white py-1 shadow-lg z-50">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                locale === currentLocale
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-warm-700 hover:bg-warm-50"
              }`}
            >
              <span>{LOCALE_FLAGS[locale]}</span>
              <span>{LOCALE_LABELS[locale]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
