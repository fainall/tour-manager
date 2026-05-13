"use client";

import { ArrowLeft, Printer, Clock, MapPin, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/generated/prisma/client";

type VoucherData = {
  bookingNumber: number;
  tourName: string;
  tourDescription: string | null;
  tourDuration: number;
  meetingPoint: string | null;
  includedItems: string[];
  tourDate: string;
  departureTime: string;
  pickupPoint: string | null;
  adultCount: number;
  childCount: number;
  totalPax: number;
  totalAmount: string;
  status: BookingStatus;
  sellerName: string;
  guideName: string | null;
  driverName: string | null;
  vehiclePlate: string | null;
  vehicleName: string | null;
  clientNotes: string | null;
  passengers: {
    name: string;
    nationality: string | null;
    documentNumber: string | null;
    paxType: string;
  }[];
  vouchers: {
    id: string;
    voucherCode: string;
    voucherType: string;
    seatInfo: string | null;
    issuedAt: string;
    passengerId: string | null;
  }[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
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
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function VoucherPrint({ data, type }: { data: VoucherData; type: string }) {
  function handlePrint() {
    window.print();
  }

  const bookingId = typeof window !== "undefined"
    ? window.location.pathname.split("/bookings/")[1]?.split("/")[0]
    : "";

  return (
    <div>
      {/* Screen-only toolbar */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/bookings/${bookingId}`}
            className="rounded-lg p-2 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-warm-900">
              Voucher {type === "BOARDING" ? "de Embarque" : "Comercial"}
            </h1>
            <p className="text-sm text-warm-500">Reserva #{data.bookingNumber}</p>
          </div>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {type === "BOARDING" ? (
        <BoardingVouchers data={data} />
      ) : (
        <CommercialVoucher data={data} />
      )}
    </div>
  );
}

function BoardingVouchers({ data }: { data: VoucherData }) {
  return (
    <div className="space-y-8 print:space-y-0">
      {data.passengers.map((pax, idx) => {
        const voucher = data.vouchers[idx];
        return (
          <div
            key={idx}
            className="mx-auto max-w-[700px] rounded-2xl border-2 border-warm-200 bg-white print:break-after-page print:rounded-none print:border print:max-w-none"
          >
            {/* Header band */}
            <div className="rounded-t-2xl bg-primary-600 px-6 py-4 print:rounded-none print:bg-primary-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                    Boarding Pass
                  </p>
                  <h2 className="text-xl font-bold text-white">{data.tourName}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary-200">Voucher</p>
                  <p className="font-mono text-lg font-bold text-white">
                    {voucher?.voucherCode ?? `#${data.bookingNumber}-${idx + 1}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Passenger info */}
              <div className="mb-4 rounded-xl bg-warm-50 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-warm-400">Pasajero</p>
                    <p className="text-lg font-bold text-warm-900">{pax.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-warm-400">Asiento</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {voucher?.seatInfo ?? idx + 1}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-warm-400">Tipo</p>
                    <p className="font-medium">{pax.paxType === "ADULT" ? "Adulto" : "Niño"}</p>
                  </div>
                  {pax.nationality && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-warm-400">Nacionalidad</p>
                      <p className="font-medium">{pax.nationality}</p>
                    </div>
                  )}
                  {pax.documentNumber && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-warm-400">Documento</p>
                      <p className="font-medium">{pax.documentNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tour details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-primary-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-warm-400">Fecha y Hora</p>
                    <p className="font-semibold text-warm-900">{formatDate(data.tourDate)}</p>
                    <p className="text-warm-600">{data.departureTime} hrs</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-warm-400">Punto de Encuentro</p>
                    <p className="font-semibold text-warm-900">
                      {data.pickupPoint || data.meetingPoint || "Por confirmar"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Operational info */}
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-warm-200 p-3 text-xs">
                {data.guideName && (
                  <div>
                    <p className="text-warm-400 uppercase">Guía</p>
                    <p className="font-medium text-warm-700">{data.guideName}</p>
                  </div>
                )}
                {data.vehicleName && (
                  <div>
                    <p className="text-warm-400 uppercase">Vehículo</p>
                    <p className="font-medium text-warm-700">{data.vehicleName}</p>
                  </div>
                )}
                {data.vehiclePlate && (
                  <div>
                    <p className="text-warm-400 uppercase">Patente</p>
                    <p className="font-mono font-medium text-warm-700">{data.vehiclePlate}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-warm-300 pt-3 text-xs text-warm-400">
                <span>Reserva #{data.bookingNumber} · {data.totalPax} PAX total</span>
                <span>Duración: {formatDuration(data.tourDuration)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommercialVoucher({ data }: { data: VoucherData }) {
  const voucher = data.vouchers[0];
  const included = Array.isArray(data.includedItems) ? data.includedItems : [];

  return (
    <div className="mx-auto max-w-[700px] rounded-2xl border-2 border-warm-200 bg-white print:rounded-none print:border print:max-w-none">
      {/* Header */}
      <div className="rounded-t-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 print:rounded-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
              Voucher de Servicio
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{data.tourName}</h2>
            {data.tourDescription && (
              <p className="mt-1 text-sm text-primary-200 max-w-md">{data.tourDescription}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-200">Código</p>
            <p className="font-mono text-lg font-bold text-white">
              {voucher?.voucherCode ?? `#${data.bookingNumber}`}
            </p>
            <p className="mt-1 text-xs text-primary-200">
              Reserva #{data.bookingNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Date + Time + Status */}
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5 text-primary-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-400">Fecha</p>
              <p className="font-semibold text-warm-900">{formatDate(data.tourDate)}</p>
              <p className="text-sm text-warm-600">{data.departureTime} hrs</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 text-primary-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-400">Punto de Encuentro</p>
              <p className="font-semibold text-warm-900">
                {data.pickupPoint || data.meetingPoint || "Por confirmar"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 text-primary-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-400">Pasajeros</p>
              <p className="font-semibold text-warm-900">{data.totalPax} PAX</p>
              <p className="text-xs text-warm-500">
                {data.adultCount} adulto(s){data.childCount > 0 ? `, ${data.childCount} niño(s)` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Passenger list */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
            Lista de Pasajeros
          </p>
          <div className="rounded-xl border border-warm-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">Nacionalidad</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">Documento</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-warm-500">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {data.passengers.map((pax, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "" : "bg-warm-50/50"}>
                    <td className="px-4 py-2 font-medium text-warm-400">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-warm-900">{pax.name}</td>
                    <td className="px-4 py-2 text-warm-600">{pax.nationality || "—"}</td>
                    <td className="px-4 py-2 text-warm-600">{pax.documentNumber || "—"}</td>
                    <td className="px-4 py-2 text-warm-600">{pax.paxType === "ADULT" ? "Adulto" : "Niño"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Included items */}
        {included.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
              Incluye
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {included.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-warm-700">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operational details */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-warm-50 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-warm-400">Duración</p>
            <p className="font-medium text-warm-700">{formatDuration(data.tourDuration)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-warm-400">Vendedor</p>
            <p className="font-medium text-warm-700">{data.sellerName}</p>
          </div>
          {data.guideName && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-400">Guía</p>
              <p className="font-medium text-warm-700">{data.guideName}</p>
            </div>
          )}
          {data.vehicleName && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-400">Vehículo</p>
              <p className="font-medium text-warm-700">
                {data.vehicleName} {data.vehiclePlate ? `(${data.vehiclePlate})` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Client notes */}
        {data.clientNotes && (
          <div className="rounded-lg border border-warm-200 p-4">
            <p className="text-[10px] uppercase tracking-wider text-warm-400 mb-1">Notas</p>
            <p className="text-sm text-warm-700">{data.clientNotes}</p>
          </div>
        )}

        {/* Payment summary */}
        <div className="flex items-center justify-between rounded-xl bg-primary-50 p-4">
          <div>
            <p className="text-xs text-primary-500 uppercase">Estado</p>
            <p className="font-semibold text-primary-700">{BOOKING_STATUS_LABELS[data.status]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-primary-700">
              ${parseFloat(data.totalAmount).toLocaleString("es-CL")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-warm-300 pt-3 text-center text-xs text-warm-400">
          <p>Documento generado el {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}
