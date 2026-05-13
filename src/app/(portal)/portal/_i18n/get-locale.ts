import { cookies, headers } from "next/headers";
import { type Locale, LOCALES, DEFAULT_LOCALE } from "./index";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("portal-locale")?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language") ?? "";
  for (const part of acceptLang.split(",")) {
    const lang = part.split(";")[0].trim().substring(0, 2).toLowerCase();
    if (lang === "en") return "en";
    if (lang === "pt") return "pt";
    if (lang === "es") return "es";
  }

  return DEFAULT_LOCALE;
}
