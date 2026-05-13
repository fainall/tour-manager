"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Users, CreditCard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TourOption = {
  id: string;
  name: string;
  categoryName: string | null;
  durationMinutes: number;
  priceAdult: string;
  priceChild: string;
  minPriceAdult: string | null;
  minPriceChild: string | null;
  maxPax: number | null;
  meetingPoint: string | null;
  schedules: { dayOfWeek: string; departureTime: string }[];
};

type StaffOptions = {
  guides: { value: string; label: string }[];
  drivers: { value: string; label: string }[];
  vehicles: { value: string; label: string }[];
};

type PassengerEntry = {
  firstName: string;
  lastName: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  paxType: "ADULT" | "CHILD";
};

type BookingWizardProps = {
  tours: TourOption[];
  staff: StaffOptions;
};

const STEPS = [
  { label: "Tour y Fecha", icon: MapPin },
  { label: "Pasajeros", icon: Users },
  { label: "Resumen", icon: CreditCard },
];

const emptyPassenger = (): PassengerEntry => ({
  firstName: "",
  lastName: "",
  nationality: "",
  documentType: "RUT",
  documentNumber: "",
  email: "",
  phone: "",
  paxType: "ADULT",
});

export function BookingWizard({ tours, staff }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [tourId, setTourId] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [unitPriceAdult, setUnitPriceAdult] = useState("");
  const [unitPriceChild, setUnitPriceChild] = useState("");
  const [guideId, setGuideId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [passengers, setPassengers] = useState<PassengerEntry[]>([emptyPassenger()]);

  const selectedTour = tours.find((t) => t.id === tourId);

  function handleTourSelect(id: string) {
    setTourId(id);
    const tour = tours.find((t) => t.id === id);
    if (tour) {
      setUnitPriceAdult(tour.priceAdult);
      setUnitPriceChild(tour.priceChild);
      if (tour.schedules.length > 0) {
        setDepartureTime(tour.schedules[0].departureTime);
      }
    }
  }

  function addPassenger() {
    setPassengers([...passengers, emptyPassenger()]);
  }

  function removePassenger(index: number) {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  }

  function updatePassenger(index: number, field: keyof PassengerEntry, value: string) {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  }

  const adultCount = passengers.filter((p) => p.paxType === "ADULT").length;
  const childCount = passengers.filter((p) => p.paxType === "CHILD").length;
  const totalAmount =
    adultCount * parseFloat(unitPriceAdult || "0") +
    childCount * parseFloat(unitPriceChild || "0");

  function canNext() {
    if (step === 0) return tourId && tourDate && departureTime;
    if (step === 1) return passengers.every((p) => p.firstName && p.lastName);
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId,
          tourDate,
          departureTime,
          pickupPoint,
          adultCount,
          childCount,
          unitPriceAdult: parseFloat(unitPriceAdult),
          unitPriceChild: parseFloat(unitPriceChild),
          guideId,
          driverId,
          vehicleId,
          internalNotes,
          clientNotes,
          passengers: passengers.map((p) => ({
            ...p,
            unitPrice: p.paxType === "ADULT" ? parseFloat(unitPriceAdult) : parseFloat(unitPriceChild),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || "Error al crear reserva");
        return;
      }

      router.push("/bookings");
      router.refresh();
    } catch {
      setApiError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                i === step
                  ? "bg-primary-500 text-white shadow-sm"
                  : i < step
                  ? "bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200"
                  : "bg-warm-100 text-warm-400"
              }`}
            >
              {i < step ? (
                <Check className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-px w-8 ${i < step ? "bg-emerald-300" : "bg-warm-200"}`} />
            )}
          </div>
        ))}
      </div>

      {apiError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{apiError}</div>
      )}

      {/* Step 1: Tour Selection */}
      {step === 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seleccionar Tour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tours.map((tour) => (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={() => handleTourSelect(tour.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      tourId === tour.id
                        ? "border-primary-500 bg-primary-50 shadow-sm"
                        : "border-warm-200 hover:border-warm-300 hover:shadow-sm"
                    }`}
                  >
                    {tour.categoryName && (
                      <p className="text-xs font-medium text-warm-400 uppercase">{tour.categoryName}</p>
                    )}
                    <p className="font-semibold text-warm-900">{tour.name}</p>
                    <p className="mt-1 text-sm text-warm-500">
                      ${parseFloat(tour.priceAdult).toLocaleString("es-CL")} / adulto
                    </p>
                    {tour.maxPax && (
                      <Badge variant="neutral" className="mt-2">Máx. {tour.maxPax} PAX</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedTour && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fecha y Horario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Fecha del Tour *"
                    type="date"
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <Input
                    label="Hora de Salida *"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                  />
                  <Input
                    label="Punto de Recogida"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    placeholder={selectedTour.meetingPoint || "Ej: Hotel"}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Precio Adulto"
                    type="number"
                    min="0"
                    value={unitPriceAdult}
                    onChange={(e) => setUnitPriceAdult(e.target.value)}
                  />
                  <Input
                    label="Precio Niño"
                    type="number"
                    min="0"
                    value={unitPriceChild}
                    onChange={(e) => setUnitPriceChild(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select
                    label="Guía"
                    value={guideId}
                    onChange={(e) => setGuideId(e.target.value)}
                    options={staff.guides}
                    placeholder="Sin asignar"
                  />
                  <Select
                    label="Conductor"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    options={staff.drivers}
                    placeholder="Sin asignar"
                  />
                  <Select
                    label="Vehículo"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    options={staff.vehicles}
                    placeholder="Sin asignar"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Passengers */}
      {step === 1 && (
        <div className="space-y-4">
          {passengers.map((pax, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Pasajero {i + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pax.paxType}
                      onChange={(e) => updatePassenger(i, "paxType", e.target.value)}
                      options={[
                        { value: "ADULT", label: "Adulto" },
                        { value: "CHILD", label: "Niño" },
                      ]}
                      className="h-8 w-28 text-xs"
                    />
                    {passengers.length > 1 && (
                      <button
                        onClick={() => removePassenger(i)}
                        className="rounded-md p-1.5 text-warm-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Nombre *"
                    value={pax.firstName}
                    onChange={(e) => updatePassenger(i, "firstName", e.target.value)}
                    placeholder="Nombre"
                  />
                  <Input
                    label="Apellido *"
                    value={pax.lastName}
                    onChange={(e) => updatePassenger(i, "lastName", e.target.value)}
                    placeholder="Apellido"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="Nacionalidad"
                    value={pax.nationality}
                    onChange={(e) => updatePassenger(i, "nationality", e.target.value)}
                    placeholder="Ej: Chilena"
                  />
                  <Select
                    label="Tipo Doc."
                    value={pax.documentType}
                    onChange={(e) => updatePassenger(i, "documentType", e.target.value)}
                    options={[
                      { value: "RUT", label: "RUT" },
                      { value: "DNI", label: "DNI" },
                      { value: "PASSPORT", label: "Pasaporte" },
                    ]}
                  />
                  <Input
                    label="Nº Documento"
                    value={pax.documentNumber}
                    onChange={(e) => updatePassenger(i, "documentNumber", e.target.value)}
                    placeholder="Ej: 12.345.678-9"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={pax.email}
                    onChange={(e) => updatePassenger(i, "email", e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                  <Input
                    label="Teléfono"
                    value={pax.phone}
                    onChange={(e) => updatePassenger(i, "phone", e.target.value)}
                    placeholder="+56912345678"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="secondary" onClick={addPassenger} className="w-full">
            <Plus className="h-4 w-4" />
            Agregar Pasajero
          </Button>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de la Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-warm-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-warm-500">Tour</span>
                <span className="text-sm font-medium text-warm-900">{selectedTour?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-500">Fecha</span>
                <span className="text-sm font-medium text-warm-900">
                  {new Date(tourDate + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-500">Hora</span>
                <span className="text-sm font-medium text-warm-900">{departureTime}</span>
              </div>
              {pickupPoint && (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-500">Recogida</span>
                  <span className="text-sm font-medium text-warm-900">{pickupPoint}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-warm-50 p-4 space-y-2">
              <p className="text-sm font-medium text-warm-700 mb-2">Pasajeros ({passengers.length})</p>
              {passengers.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-warm-600">{p.firstName} {p.lastName}</span>
                  <Badge variant={p.paxType === "ADULT" ? "info" : "warning"}>
                    {p.paxType === "ADULT" ? "Adulto" : "Niño"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-warm-600">{adultCount} Adulto(s) × ${parseFloat(unitPriceAdult).toLocaleString("es-CL")}</span>
                <span className="font-medium">${(adultCount * parseFloat(unitPriceAdult || "0")).toLocaleString("es-CL")}</span>
              </div>
              {childCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-600">{childCount} Niño(s) × ${parseFloat(unitPriceChild).toLocaleString("es-CL")}</span>
                  <span className="font-medium">${(childCount * parseFloat(unitPriceChild || "0")).toLocaleString("es-CL")}</span>
                </div>
              )}
              <div className="border-t border-primary-200 pt-2 flex justify-between">
                <span className="text-base font-semibold text-warm-900">Total</span>
                <span className="text-xl font-bold text-primary-600">${totalAmount.toLocaleString("es-CL")}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-warm-700">Notas para el cliente</label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm resize-none focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Notas visibles en el voucher..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-warm-700">Notas internas</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm resize-none focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Solo visible para el equipo..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/bookings")}
        >
          {step === 0 ? "Cancelar" : "Anterior"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            loading={loading}
            size="lg"
          >
            Crear Reserva
          </Button>
        )}
      </div>
    </div>
  );
}
