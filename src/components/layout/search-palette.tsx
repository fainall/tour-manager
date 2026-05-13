"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import {
  Search, CalendarCheck, Users, Map, X, Hash, Globe, Mail,
} from "lucide-react";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/generated/prisma/client";

type SearchResults = {
  bookings: {
    id: string;
    bookingNumber: number;
    tourName: string;
    tourDate: string;
    status: BookingStatus;
    totalPax: number;
    sellerName: string;
  }[];
  passengers: {
    id: string;
    name: string;
    nationality: string | null;
    documentNumber: string | null;
    email: string | null;
  }[];
  tours: {
    id: string;
    name: string;
    isActive: boolean;
    priceAdult: string;
    categoryName: string | null;
  }[];
};

const STATUS_BADGE: Record<string, "warning" | "success" | "info" | "primary" | "danger" | "neutral"> = {
  RESERVED: "warning",
  CONFIRMED: "success",
  COMPLETED: "info",
  PAID: "primary",
  CANCELLED: "danger",
  NO_SHOW: "neutral",
};

export type SearchPaletteHandle = { open: () => void };

export const SearchPalette = forwardRef<SearchPaletteHandle>(function SearchPalette(_props, ref) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setResults(await res.json());
        setSelectedIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function getAllItems() {
    if (!results) return [];
    const items: { type: string; id: string; href: string }[] = [];
    for (const b of results.bookings) items.push({ type: "booking", id: b.id, href: `/bookings/${b.id}` });
    for (const p of results.passengers) items.push({ type: "passenger", id: p.id, href: `/passengers/${p.id}` });
    for (const t of results.tours) items.push({ type: "tour", id: t.id, href: `/tours/${t.id}` });
    return items;
  }

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const items = getAllItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[selectedIndex]) {
      e.preventDefault();
      navigateTo(items[selectedIndex].href);
    }
  }

  const totalResults = results
    ? results.bookings.length + results.passengers.length + results.tours.length
    : 0;

  let itemCounter = 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-warm-900/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl rounded-2xl border border-warm-200 bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-warm-200 px-4">
          <Search className="h-5 w-5 text-warm-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar reservas, pasajeros, tours..."
            className="flex-1 py-4 text-base text-warm-900 placeholder:text-warm-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults(null); }} className="text-warm-400 hover:text-warm-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded border border-warm-200 bg-warm-100 px-1.5 py-0.5 text-[10px] font-medium text-warm-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="py-8 text-center text-sm text-warm-400">Buscando...</div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-warm-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results && results.bookings.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-warm-400">
                Reservas
              </p>
              {results.bookings.map((b) => {
                const idx = itemCounter++;
                return (
                  <button
                    key={b.id}
                    onClick={() => navigateTo(`/bookings/${b.id}`)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      idx === selectedIndex ? "bg-primary-50" : "hover:bg-warm-50"
                    }`}
                  >
                    <CalendarCheck className="h-4 w-4 text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-warm-900 truncate">
                          {b.tourName}
                        </span>
                        <Badge variant={STATUS_BADGE[b.status] || "neutral"} className="text-[10px]">
                          {BOOKING_STATUS_LABELS[b.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-warm-500">
                        #{b.bookingNumber} · {b.tourDate} · {b.totalPax} PAX · {b.sellerName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && results && results.passengers.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-warm-400">
                Pasajeros
              </p>
              {results.passengers.map((p) => {
                const idx = itemCounter++;
                return (
                  <button
                    key={p.id}
                    onClick={() => navigateTo(`/passengers/${p.id}`)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      idx === selectedIndex ? "bg-primary-50" : "hover:bg-warm-50"
                    }`}
                  >
                    <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-900">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-warm-500">
                        {p.nationality && (
                          <span className="flex items-center gap-0.5">
                            <Globe className="h-3 w-3" /> {p.nationality}
                          </span>
                        )}
                        {p.documentNumber && (
                          <span className="flex items-center gap-0.5">
                            <Hash className="h-3 w-3" /> {p.documentNumber}
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-0.5">
                            <Mail className="h-3 w-3" /> {p.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && results && results.tours.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-warm-400">
                Tours
              </p>
              {results.tours.map((t) => {
                const idx = itemCounter++;
                return (
                  <button
                    key={t.id}
                    onClick={() => navigateTo(`/tours/${t.id}`)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      idx === selectedIndex ? "bg-primary-50" : "hover:bg-warm-50"
                    }`}
                  >
                    <Map className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-warm-900">{t.name}</span>
                        {!t.isActive && (
                          <Badge variant="neutral" className="text-[10px]">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-warm-500">
                        {t.categoryName ?? "Sin categoría"} · ${parseFloat(t.priceAdult).toLocaleString("es-CL")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !results && query.length < 2 && (
            <div className="py-8 text-center text-sm text-warm-400">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}
        </div>

        {/* Footer */}
        {totalResults > 0 && (
          <div className="border-t border-warm-200 px-4 py-2 flex items-center justify-between text-xs text-warm-400">
            <span>{totalResults} resultado(s)</span>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-warm-200 bg-warm-100 px-1 py-0.5 text-[10px]">↑↓</kbd>
              <span>navegar</span>
              <kbd className="rounded border border-warm-200 bg-warm-100 px-1 py-0.5 text-[10px]">↵</kbd>
              <span>abrir</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
