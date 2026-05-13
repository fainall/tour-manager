"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Users, Truck, UserCheck, Bus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/generated/prisma/client";

type OperationBooking = {
  id: string;
  bookingNumber: number;
  tourName: string;
  tourDuration: number;
  departureTime: string;
  status: BookingStatus;
  adultCount: number;
  childCount: number;
  totalPax: number;
  totalAmount: string;
  sellerName: string;
  guideId: string | null;
  guideName: string | null;
  driverId: string | null;
  driverName: string | null;
  vehicleId: string | null;
  vehicleName: string | null;
  vehiclePlate: string | null;
  vehicleCapacity: number | null;
};

type StaffOption = { id: string; firstName: string; lastName: string };
type VehicleOption = { id: string; name: string | null; plateNumber: string; capacity: number };

const STATUS_BADGE: Record<string, "warning" | "success" | "info" | "primary" | "neutral"> = {
  RESERVED: "warning",
  CONFIRMED: "success",
  COMPLETED: "info",
  PAID: "primary",
  NO_SHOW: "neutral",
};

function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(d: Date) {
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function OperationsPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<OperationBooking[]>([]);
  const [guides, setGuides] = useState<StaffOption[]>([]);
  const [drivers, setDrivers] = useState<StaffOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const dateKey = formatDateKey(currentDate);

  const fetchData = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/operations/daily?date=${formatDateKey(date)}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
        setGuides(data.guides);
        setDrivers(data.drivers);
        setVehicles(data.vehicles);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  function navigate(dir: number) {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + dir);
    setCurrentDate(next);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  async function updateAssignment(bookingId: string, field: string, value: string) {
    setSaving(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value || null }),
      });
      if (res.ok) {
        await fetchData(currentDate);
      }
    } finally {
      setSaving(null);
    }
  }

  const totalPax = bookings.reduce((s, b) => s + b.totalPax, 0);
  const unassignedGuide = bookings.filter((b) => !b.guideId && b.status !== "NO_SHOW").length;
  const unassignedVehicle = bookings.filter((b) => !b.vehicleId && b.status !== "NO_SHOW").length;

  const byTime: Record<string, OperationBooking[]> = {};
  for (const b of bookings) {
    if (!byTime[b.departureTime]) byTime[b.departureTime] = [];
    byTime[b.departureTime].push(b);
  }
  const timeSlots = Object.keys(byTime).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Asignación Operativa</h1>
          <p className="mt-1 text-sm text-warm-500">
            Asigna guías, conductores y vehículos a las reservas del día
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Hoy
          </Button>
          <span className="min-w-[240px] text-center text-lg font-semibold text-warm-900 capitalize">
            {formatDateDisplay(currentDate)}
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-warm-900">{bookings.length}</p>
            <p className="text-xs text-warm-500">Reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-warm-900">{totalPax}</p>
            <p className="text-xs text-warm-500">Pasajeros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className={`text-2xl font-bold ${unassignedGuide > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {unassignedGuide}
            </p>
            <p className="text-xs text-warm-500">Sin Guía</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className={`text-2xl font-bold ${unassignedVehicle > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {unassignedVehicle}
            </p>
            <p className="text-xs text-warm-500">Sin Vehículo</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Time Slot */}
      <div className={`space-y-6 ${loading ? "opacity-60" : ""}`}>
        {bookings.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-warm-400">No hay reservas para este día</p>
            </CardContent>
          </Card>
        ) : (
          timeSlots.map((time) => (
            <div key={time}>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" />
                <h2 className="text-lg font-semibold text-warm-900">{time} hrs</h2>
                <Badge variant="neutral" className="text-xs">
                  {byTime[time].length} reserva(s) · {byTime[time].reduce((s, b) => s + b.totalPax, 0)} PAX
                </Badge>
              </div>

              <div className="space-y-3">
                {byTime[time].map((b) => {
                  const isSaving = saving === b.id;
                  const missingAssignment = !b.guideId || !b.vehicleId;

                  return (
                    <Card key={b.id} className={isSaving ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/bookings/${b.id}`}
                              className="text-base font-semibold text-warm-900 hover:text-primary-600 transition-colors"
                            >
                              {b.tourName}
                            </Link>
                            <Badge variant={STATUS_BADGE[b.status] || "neutral"} className="text-xs">
                              {BOOKING_STATUS_LABELS[b.status]}
                            </Badge>
                            {missingAssignment && (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Asignación pendiente
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-warm-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {b.totalPax} PAX
                            </span>
                            <span>{formatDuration(b.tourDuration)}</span>
                            <span className="font-medium text-warm-700">
                              #{b.bookingNumber}
                            </span>
                          </div>
                        </div>

                        {/* Assignment row */}
                        <div className="grid grid-cols-3 gap-4">
                          {/* Guide */}
                          <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-warm-500 mb-1">
                              <UserCheck className="h-3 w-3" /> Guía
                            </label>
                            <select
                              value={b.guideId || ""}
                              onChange={(e) => updateAssignment(b.id, "guideId", e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                                b.guideId
                                  ? "border-warm-200 bg-white"
                                  : "border-amber-300 bg-amber-50"
                              }`}
                            >
                              <option value="">Sin asignar</option>
                              {guides.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.firstName} {g.lastName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Driver */}
                          <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-warm-500 mb-1">
                              <Truck className="h-3 w-3" /> Conductor
                            </label>
                            <select
                              value={b.driverId || ""}
                              onChange={(e) => updateAssignment(b.id, "driverId", e.target.value)}
                              className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                              <option value="">Sin asignar</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.firstName} {d.lastName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Vehicle */}
                          <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-warm-500 mb-1">
                              <Bus className="h-3 w-3" /> Vehículo
                            </label>
                            <select
                              value={b.vehicleId || ""}
                              onChange={(e) => updateAssignment(b.id, "vehicleId", e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                                b.vehicleId
                                  ? "border-warm-200 bg-white"
                                  : "border-amber-300 bg-amber-50"
                              }`}
                            >
                              <option value="">Sin asignar</option>
                              {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name || v.plateNumber} ({v.capacity} pax)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-warm-400">
                          <span>Vendedor: {b.sellerName}</span>
                          <span>·</span>
                          <span>{b.adultCount} adulto(s){b.childCount > 0 ? `, ${b.childCount} niño(s)` : ""}</span>
                          <span>·</span>
                          <span>${parseFloat(b.totalAmount).toLocaleString("es-CL")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
