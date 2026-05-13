import es from "./es.json";
import en from "./en.json";
import pt from "./pt.json";

export type Locale = "es" | "en" | "pt";

export const LOCALES: Locale[] = ["es", "en", "pt"];
export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  pt: "🇧🇷",
};

const dictionaries: Record<Locale, Record<string, string>> = { es, en, pt };

export function getDictionary(locale: Locale): Record<string, string> {
  return dictionaries[locale] ?? dictionaries.es;
}

export function t(
  dict: Record<string, string>,
  key: string,
  params?: Record<string, string | number>
): string {
  let value = dict[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export const INTL_LOCALE: Record<Locale, string> = {
  es: "es-CL",
  en: "en-US",
  pt: "pt-BR",
};
