"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Users,
  Calendar,
  Clock,
  Globe,
  User,
  Baby,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Locale, INTL_LOCALE, t } from "../../_i18n";

type PassengerData = {
  id: string;
  name: string;
  nationality: string;
  paxType: string;
  checkedIn: boolean;
};

type CheckInData = {
  tourName: string;
  bookingNumber: number;
  tourDate: string;
  departureTime: string;
  token: string;
  passengers: PassengerData[];
};

function formatDate(dateStr: string, locale: Locale) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CheckInForm({
  data,
  dict,
  locale,
}: {
  data: CheckInData;
  dict: Record<string, string>;
  locale: Locale;
}) {
  const [passengers, setPassengers] = useState(data.passengers);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const unchecked = passengers.filter((p) => !p.checkedIn);
  const checkedCount = passengers.filter((p) => p.checkedIn).length;

  function togglePassenger(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === unchecked.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unchecked.map((p) => p.id)));
    }
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/portal/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          passengerIds: Array.from(selected),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setPassengers(result.passengers);
        setSelected(new Set());
        setDone(true);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  const allCheckedIn = passengers.every((p) => p.checkedIn);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
        <p className="text-primary-100 text-sm">
          {t(dict, "booking.reserva")} #{data.bookingNumber}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{data.tourName}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-primary-100">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(data.tourDate, locale)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {data.departureTime}
          </span>
        </div>
      </div>

      {/* Success banner */}
      {(done || allCheckedIn) && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">{t(dict, "checkin.success")}</p>
            <p className="text-sm text-emerald-700">
              {t(dict, "checkin.checkedCount", {
                count: checkedCount,
                total: passengers.length,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Passenger list */}
      <div className="rounded-2xl bg-white border border-warm-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-warm-900">
              {t(dict, "booking.passengers")} ({passengers.length})
            </h2>
          </div>
          {unchecked.length > 0 && (
            <button
              onClick={selectAll}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t(dict, "checkin.markAll")}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {passengers.map((p) => {
            const isChecked = p.checkedIn;
            const isSelected = selected.has(p.id);

            return (
              <button
                key={p.id}
                onClick={() => !isChecked && togglePassenger(p.id)}
                disabled={isChecked}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                  isChecked
                    ? "bg-emerald-50 border border-emerald-200"
                    : isSelected
                      ? "bg-primary-50 border border-primary-300"
                      : "bg-warm-50 border border-transparent hover:border-warm-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border text-warm-500 bg-white border-warm-200">
                    {p.paxType === "CHILD" ? (
                      <Baby className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-warm-900">{p.name}</span>
                    <div className="flex items-center gap-2 text-xs text-warm-500">
                      <Globe className="h-3 w-3" />
                      {p.nationality}
                      <span className="text-warm-300">·</span>
                      {t(dict, `checkin.${p.paxType === "CHILD" ? "child" : "adult"}`)}
                    </div>
                  </div>
                </div>

                {isChecked ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                ) : isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary-500" />
                ) : (
                  <Circle className="h-5 w-5 text-warm-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      {unchecked.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {t(dict, "checkin.submit")} ({selected.size})
        </Button>
      )}
    </div>
  );
}
