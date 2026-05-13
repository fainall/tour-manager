"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "./_i18n";

export function PortalSearch({ dict }: { dict: Record<string, string> }) {
  const router = useRouter();
  const [bookingNumber, setBookingNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingNumber || !lastName) {
      setError(t(dict, "search.errorBothFields"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/portal/booking?number=${encodeURIComponent(bookingNumber)}&lastName=${encodeURIComponent(lastName)}`
      );
      if (res.ok) {
        const data = await res.json();
        router.push(`/portal/bookings/${data.id}`);
      } else {
        const err = await res.json();
        setError(err.error || t(dict, "search.errorNotFound"));
      }
    } catch {
      setError(t(dict, "search.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-warm-200 space-y-4">
        <div>
          <label className="text-sm font-medium text-warm-700">{t(dict, "search.bookingNumber")}</label>
          <input
            type="text"
            value={bookingNumber}
            onChange={(e) => setBookingNumber(e.target.value)}
            placeholder={t(dict, "search.bookingPlaceholder")}
            className="mt-1 w-full rounded-xl border border-warm-300 bg-white px-4 py-3 text-center text-lg font-semibold tracking-wider text-warm-900 placeholder:text-warm-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-warm-700">{t(dict, "search.lastName")}</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t(dict, "search.lastNamePlaceholder")}
            className="mt-1 w-full rounded-xl border border-warm-300 bg-white px-4 py-3 text-warm-900 placeholder:text-warm-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <Search className="h-4 w-4" />
          {t(dict, "search.submit")}
        </Button>
      </div>
    </form>
  );
}
