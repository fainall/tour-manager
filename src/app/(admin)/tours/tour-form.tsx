"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, DollarSign, MapPin, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayOfWeek } from "@/generated/prisma/client";

type Schedule = { dayOfWeek: DayOfWeek; departureTime: string };

type TourData = {
  id?: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  durationMinutes: number;
  meetingPoint: string | null;
  priceAdult: string;
  priceChild: string;
  minPriceAdult: string | null;
  minPriceChild: string | null;
  directCost: string;
  maxPax: number | null;
  minPax: number;
  includedItems: string[];
  excludedItems: string[];
  notes: string | null;
  isActive?: boolean;
  schedules?: Schedule[];
};

type TourFormProps = {
  tour?: TourData;
};

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "MONDAY", label: "Lunes", short: "Lu" },
  { value: "TUESDAY", label: "Martes", short: "Ma" },
  { value: "WEDNESDAY", label: "Miércoles", short: "Mi" },
  { value: "THURSDAY", label: "Jueves", short: "Ju" },
  { value: "FRIDAY", label: "Viernes", short: "Vi" },
  { value: "SATURDAY", label: "Sábado", short: "Sá" },
  { value: "SUNDAY", label: "Domingo", short: "Do" },
];

export function TourForm({ tour }: TourFormProps) {
  const router = useRouter();
  const isEdit = !!tour?.id;

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: tour?.name ?? "",
    description: tour?.description ?? "",
    categoryId: tour?.categoryId ?? "",
    durationMinutes: tour?.durationMinutes?.toString() ?? "",
    meetingPoint: tour?.meetingPoint ?? "",
    priceAdult: tour?.priceAdult ?? "",
    priceChild: tour?.priceChild ?? "0",
    minPriceAdult: tour?.minPriceAdult ?? "",
    minPriceChild: tour?.minPriceChild ?? "",
    directCost: tour?.directCost ?? "0",
    maxPax: tour?.maxPax?.toString() ?? "",
    minPax: tour?.minPax?.toString() ?? "1",
    notes: tour?.notes ?? "",
    isActive: tour?.isActive ?? true,
  });

  const [includedItems, setIncludedItems] = useState<string[]>(tour?.includedItems ?? []);
  const [excludedItems, setExcludedItems] = useState<string[]>(tour?.excludedItems ?? []);
  const [newIncluded, setNewIncluded] = useState("");
  const [newExcluded, setNewExcluded] = useState("");

  const [schedules, setSchedules] = useState<Schedule[]>(tour?.schedules ?? []);
  const [scheduleTime, setScheduleTime] = useState("09:00");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) =>
        setCategories(data.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      );
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name) errs.name = "Nombre es obligatorio";
    if (!form.durationMinutes) errs.durationMinutes = "Duración es obligatoria";
    if (!form.priceAdult) errs.priceAdult = "Precio adulto es obligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function addIncluded() {
    if (newIncluded.trim()) {
      setIncludedItems([...includedItems, newIncluded.trim()]);
      setNewIncluded("");
    }
  }

  function addExcluded() {
    if (newExcluded.trim()) {
      setExcludedItems([...excludedItems, newExcluded.trim()]);
      setNewExcluded("");
    }
  }

  function toggleDay(day: DayOfWeek) {
    const existing = schedules.filter((s) => s.dayOfWeek === day);
    if (existing.length > 0) {
      setSchedules(schedules.filter((s) => s.dayOfWeek !== day));
    } else {
      setSchedules([...schedules, { dayOfWeek: day, departureTime: scheduleTime }]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    const payload = {
      ...form,
      includedItems,
      excludedItems,
      schedules,
    };

    try {
      const url = isEdit ? `/api/tours/${tour.id}` : "/api/tours";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || "Error al guardar tour");
        return;
      }

      router.push("/tours");
      router.refresh();
    } catch {
      setApiError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const durationHours = form.durationMinutes ? Math.floor(parseInt(form.durationMinutes) / 60) : 0;
  const durationMins = form.durationMinutes ? parseInt(form.durationMinutes) % 60 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{apiError}</div>
      )}

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary-500" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre del Tour *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            placeholder="Ej: Torres del Paine Full Day"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-warm-700">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              placeholder="Descripción detallada del tour..."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Categoría"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categories}
              placeholder="Sin categoría"
            />
            <div>
              <Input
                label="Duración (minutos) *"
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                error={errors.durationMinutes}
                placeholder="Ej: 480"
              />
              {form.durationMinutes && (
                <p className="mt-1 text-xs text-warm-400">
                  {durationHours}h {durationMins > 0 ? `${durationMins}min` : ""}
                </p>
              )}
            </div>
            <Input
              label="Punto de Encuentro"
              value={form.meetingPoint}
              onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
              placeholder="Ej: Hotel Las Torres"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary-500" />
            Precios y Costos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Input
              label="Precio Adulto *"
              type="number"
              min="0"
              value={form.priceAdult}
              onChange={(e) => setForm({ ...form, priceAdult: e.target.value })}
              error={errors.priceAdult}
              placeholder="95000"
            />
            <Input
              label="Precio Niño"
              type="number"
              min="0"
              value={form.priceChild}
              onChange={(e) => setForm({ ...form, priceChild: e.target.value })}
              placeholder="55000"
            />
            <Input
              label="Mín. Adulto"
              type="number"
              min="0"
              value={form.minPriceAdult}
              onChange={(e) => setForm({ ...form, minPriceAdult: e.target.value })}
              placeholder="80000"
            />
            <Input
              label="Mín. Niño"
              type="number"
              min="0"
              value={form.minPriceChild}
              onChange={(e) => setForm({ ...form, minPriceChild: e.target.value })}
              placeholder="45000"
            />
            <Input
              label="Costo Directo"
              type="number"
              min="0"
              value={form.directCost}
              onChange={(e) => setForm({ ...form, directCost: e.target.value })}
              placeholder="25000"
            />
          </div>
          {form.priceAdult && form.directCost && (
            <div className="mt-3 rounded-lg bg-emerald-50 p-3">
              <p className="text-sm text-emerald-700">
                Margen por adulto:{" "}
                <span className="font-semibold">
                  ${(parseFloat(form.priceAdult) - parseFloat(form.directCost || "0")).toLocaleString("es-CL")}
                </span>
                {" "}({((1 - parseFloat(form.directCost || "0") / parseFloat(form.priceAdult)) * 100).toFixed(0)}%)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary-500" />
            Capacidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="Mín. PAX"
              type="number"
              min="1"
              value={form.minPax}
              onChange={(e) => setForm({ ...form, minPax: e.target.value })}
              placeholder="1"
            />
            <Input
              label="Máx. PAX"
              type="number"
              min="1"
              value={form.maxPax}
              onChange={(e) => setForm({ ...form, maxPax: e.target.value })}
              placeholder="15"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary-500" />
            Horarios de Salida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <Input
              label="Hora de Salida"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = schedules.some((s) => s.dayOfWeek === day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-primary-500 text-white shadow-sm"
                      : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                  }`}
                  title={day.label}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          {schedules.length > 0 && (
            <p className="text-sm text-warm-500">
              <Clock className="inline h-3.5 w-3.5 mr-1" />
              Sale a las {scheduleTime} los{" "}
              {schedules
                .map((s) => DAYS.find((d) => d.value === s.dayOfWeek)?.label)
                .join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Included / Excluded */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-700">Incluye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newIncluded}
                onChange={(e) => setNewIncluded(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIncluded())}
                placeholder="Ej: Transporte"
                className="h-10 flex-1 rounded-lg border border-warm-300 bg-white px-3 text-sm placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <Button type="button" size="sm" onClick={addIncluded}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {includedItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <span>✓ {item}</span>
                  <button
                    type="button"
                    onClick={() => setIncludedItems(includedItems.filter((_, idx) => idx !== i))}
                    className="text-emerald-400 hover:text-emerald-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-700">No Incluye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newExcluded}
                onChange={(e) => setNewExcluded(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExcluded())}
                placeholder="Ej: Propinas"
                className="h-10 flex-1 rounded-lg border border-warm-300 bg-white px-3 text-sm placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <Button type="button" size="sm" onClick={addExcluded}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {excludedItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  <span>✕ {item}</span>
                  <button
                    type="button"
                    onClick={() => setExcludedItems(excludedItems.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-warm-700">Notas Internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              placeholder="Notas visibles solo para el equipo..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-warm-200 pt-6">
        <Button type="button" variant="secondary" onClick={() => router.push("/tours")}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} size="lg">
          {isEdit ? "Guardar Cambios" : "Crear Tour"}
        </Button>
      </div>
    </form>
  );
}
