"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/generated/prisma/client";

type CalendarBooking = {
  id: string;
  bookingNumber: number;
  tourName: string;
  tourDate: string;
  departureTime: string;
  status: BookingStatus;
  adultCount: number;
  childCount: number;
  totalPax: number;
  totalAmount: string;
  sellerName: string;
  guideName: string | null;
};

type CalendarViewProps = {
  initialBookings: CalendarBooking[];
  initialMonth: string;
};

const DAYS_HEADER = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_COLORS: Record<string, string> = {
  RESERVED: "bg-amber-400",
  CONFIRMED: "bg-emerald-400",
  COMPLETED: "bg-indigo-400",
  PAID: "bg-green-400",
  NO_SHOW: "bg-warm-400",
};

const STATUS_BADGE: Record<string, "warning" | "success" | "info" | "primary" | "neutral"> = {
  RESERVED: "warning",
  CONFIRMED: "success",
  COMPLETED: "info",
  PAID: "primary",
  NO_SHOW: "neutral",
};

export function CalendarView({ initialBookings, initialMonth }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(initialMonth));
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchBookings = useCallback(async (date: Date) => {
    setLoading(true);
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    try {
      const res = await fetch(
        `/api/bookings/calendar?from=${first.toISOString().split("T")[0]}&to=${last.toISOString().split("T")[0]}`
      );
      if (res.ok) {
        setBookings(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function navigate(dir: number) {
    const next = new Date(year, month + dir, 1);
    setCurrentDate(next);
    setSelectedDate(null);
    fetchBookings(next);
  }

  function goToday() {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDateKey(today));
    fetchBookings(today);
  }

  function formatDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday=0
  const totalDays = lastDayOfMonth.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);

  const today = new Date();
  const todayKey = formatDateKey(today);

  // Group bookings by date
  const bookingsByDate: Record<string, CalendarBooking[]> = {};
  for (const b of bookings) {
    if (!bookingsByDate[b.tourDate]) bookingsByDate[b.tourDate] = [];
    bookingsByDate[b.tourDate].push(b);
  }

  const selectedBookings = selectedDate ? bookingsByDate[selectedDate] || [] : [];

  // Stats for the month
  const totalPaxMonth = bookings.reduce((sum, b) => sum + b.totalPax, 0);
  const totalRevenueMonth = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
  const daysWithBookings = Object.keys(bookingsByDate).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Calendario</h1>
          <p className="mt-1 text-sm text-warm-500">
            Vista de reservas por día
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Hoy
          </Button>
          <span className="min-w-[180px] text-center text-lg font-semibold text-warm-900">
            {MONTHS[month]} {year}
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-warm-900">{bookings.length}</p>
            <p className="text-xs text-warm-500">Reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-warm-900">{totalPaxMonth}</p>
            <p className="text-xs text-warm-500">Pasajeros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-primary-600">${totalRevenueMonth.toLocaleString("es-CL")}</p>
            <p className="text-xs text-warm-500">Ingresos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className={loading ? "opacity-60 transition-opacity" : ""}>
            <CardContent className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_HEADER.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-warm-500 uppercase">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  if (day === null) return <div key={i} className="aspect-square" />;

                  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayBookings = bookingsByDate[dateKey] || [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDate;
                  const totalPax = dayBookings.reduce((s, b) => s + b.totalPax, 0);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`relative aspect-square rounded-xl p-1 text-left transition-all ${
                        isSelected
                          ? "bg-primary-50 ring-2 ring-primary-500"
                          : isToday
                          ? "bg-primary-50/50 ring-1 ring-primary-200"
                          : "hover:bg-warm-50"
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        isToday ? "text-primary-600" : "text-warm-700"
                      }`}>
                        {day}
                      </span>
                      {dayBookings.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          <div className="flex gap-0.5">
                            {dayBookings.slice(0, 3).map((b, j) => (
                              <div
                                key={j}
                                className={`h-1.5 flex-1 rounded-full ${STATUS_COLORS[b.status] || "bg-warm-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-warm-500 leading-tight truncate">
                            {totalPax} PAX
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Detail Sidebar */}
        <div>
          {selectedDate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </CardTitle>
                <p className="text-sm text-warm-500">
                  {selectedBookings.length} reserva(s) · {selectedBookings.reduce((s, b) => s + b.totalPax, 0)} PAX
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedBookings.length === 0 ? (
                  <p className="text-sm text-warm-400 py-8 text-center">Sin reservas este día</p>
                ) : (
                  selectedBookings.map((b) => (
                    <Link key={b.id} href={`/bookings/${b.id}`}>
                      <div className="rounded-xl border border-warm-200 p-3 transition-all hover:shadow-sm hover:border-warm-300">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-warm-900">{b.tourName}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-warm-500">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" /> {b.departureTime}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Users className="h-3 w-3" /> {b.totalPax} PAX
                              </span>
                            </div>
                          </div>
                          <Badge variant={STATUS_BADGE[b.status] || "neutral"} className="text-[10px]">
                            {BOOKING_STATUS_LABELS[b.status]}
                          </Badge>
                        </div>
                        {b.guideName && (
                          <p className="mt-1.5 text-xs text-warm-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Guía: {b.guideName}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-warm-500">
                          #{b.bookingNumber} · Vendedor: {b.sellerName}
                        </p>
                      </div>
                    </Link>
                  ))
                )}

                {selectedBookings.length > 0 && (
                  <div className="rounded-lg bg-warm-50 p-3 text-center">
                    <p className="text-sm font-semibold text-warm-900">
                      Total: ${selectedBookings.reduce((s, b) => s + parseFloat(b.totalAmount), 0).toLocaleString("es-CL")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-warm-400">Selecciona un día para ver sus reservas</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
