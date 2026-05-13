import { PortalSearch } from "./portal-search";
import { getLocale } from "./_i18n/get-locale";
import { getDictionary, t } from "./_i18n";

export default async function PortalPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-warm-900">{t(dict, "portal.title")}</h1>
        <p className="mt-2 text-warm-500">{t(dict, "portal.subtitle")}</p>
      </div>

      <PortalSearch dict={dict} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {(["step1", "step2", "step3"] as const).map((step, i) => (
          <div key={step} className="rounded-2xl bg-white p-6 text-center shadow-sm border border-warm-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <span className="text-xl">{i + 1}</span>
            </div>
            <h3 className="font-semibold text-warm-900">{t(dict, `steps.${step}.title`)}</h3>
            <p className="mt-1 text-sm text-warm-500">{t(dict, `steps.${step}.desc`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
