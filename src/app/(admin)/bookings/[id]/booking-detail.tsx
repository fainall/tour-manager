"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign,
  CheckCircle, XCircle, AlertTriangle, History, FileText, Ticket,
  Mail, MessageSquare, Send, Phone, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BOOKING_STATUS_LABELS, VALID_STATUS_TRANSITIONS } from "@/lib/constants";
import type { BookingStatus, UserRole } from "@/generated/prisma/client";

type BookingData = {
  id: string;
  bookingNumber: number;
  tourName: string;
  tourDate: string;
  departureTime: string;
  pickupPoint: string | null;
  adultCount: number;
  childCount: number;
  unitPriceAdult: string;
  unitPriceChild: string;
  totalAmount: string;
  status: BookingStatus;
  seller: { id: string; firstName: string; lastName: string; email: string };
  guide: { id: string; firstName: string; lastName: string } | null;
  driver: { id: string; firstName: string; lastName: string } | null;
  vehicle: { name: string | null; plateNumber: string } | null;
  internalNotes: string | null;
  clientNotes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  passengers: {
    id: string;
    paxType: string;
    unitPrice: string;
    checkedIn: boolean;
    passenger: {
      firstName: string;
      lastName: string;
      nationality: string | null;
      documentNumber: string | null;
      email: string | null;
      phone: string | null;
    };
  }[];
  statusHistory: {
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }[];
};

const STATUS_BADGE_VARIANT: Record<string, "warning" | "success" | "info" | "primary" | "danger" | "neutral"> = {
  RESERVED: "warning",
  CONFIRMED: "success",
  COMPLETED: "info",
  PAID: "primary",
  CANCELLED: "danger",
  NO_SHOW: "neutral",
};

const TRANSITION_LABELS: Record<string, { label: string; variant: "primary" | "success" | "danger" }> = {
  CONFIRMED: { label: "Confirmar", variant: "success" },
  COMPLETED: { label: "Completar", variant: "primary" },
  PAID: { label: "Marcar Pagada", variant: "success" },
  CANCELLED: { label: "Cancelar", variant: "danger" },
  NO_SHOW: { label: "No Show", variant: "danger" },
};

export function BookingDetail({ booking, userRole }: { booking: BookingData; userRole: UserRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const transitions = VALID_STATUS_TRANSITIONS[booking.status] || [];
  const canManage = ["ADMIN", "SALES_SUPERVISOR"].includes(userRole);
  const canGenerateVoucher = ["CONFIRMED", "COMPLETED", "PAID"].includes(booking.status);
  const [generatingVoucher, setGeneratingVoucher] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function changeStatus(newStatus: string, reason?: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason,
          ...(newStatus === "CANCELLED" ? { cancellationReason: reason } : {}),
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
      setCancelModal(false);
    }
  }

  async function generateVoucher(type: "BOARDING" | "COMMERCIAL") {
    setGeneratingVoucher(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherType: type }),
      });
      if (res.ok) {
        const queryType = type === "COMMERCIAL" ? "commercial" : "boarding";
        window.open(`/bookings/${booking.id}/voucher?type=${queryType}`, "_blank");
      }
    } finally {
      setGeneratingVoucher(false);
    }
  }

  async function sendBookingEmail() {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/notify`, { method: "POST" });
      if (res.ok) setEmailSent(true);
    } finally {
      setSendingEmail(false);
    }
  }

  function buildWhatsAppMessage() {
    const date = new Date(booking.tourDate).toLocaleDateString("es-CL", {
      weekday: "long", day: "numeric", month: "long",
    });
    return encodeURIComponent(
      `¡Hola! 👋 Tu reserva #${booking.bookingNumber} está confirmada.\n\n` +
      `🏔️ *${booking.tourName}*\n` +
      `📅 ${date}\n` +
      `🕐 ${booking.departureTime} hrs\n` +
      `👥 ${booking.adultCount + booking.childCount} pasajero(s)\n` +
      (booking.pickupPoint ? `📍 ${booking.pickupPoint}\n` : "") +
      `\n✅ Consulta tu reserva en:\n${window.location.origin}/portal/bookings/${booking.id}\n\n` +
      `¡Nos vemos pronto! 🌟`
    );
  }

  const passengerPhones = booking.passengers
    .map((bp) => bp.passenger.phone)
    .filter((p): p is string => !!p);

  const passengerEmails = booking.passengers
    .map((bp) => bp.passenger.email)
    .filter((e): e is string => !!e);

  const tourDate = new Date(booking.tourDate);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/bookings"
            className="rounded-lg p-2 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-warm-900">
                Reserva #{booking.bookingNumber}
              </h1>
              <Badge variant={STATUS_BADGE_VARIANT[booking.status]} dot className="text-sm">
                {BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-warm-500">{booking.tourName}</p>
          </div>
        </div>

        {canManage && transitions.length > 0 && (
          <div className="flex gap-2">
            {transitions.map((t) => {
              const config = TRANSITION_LABELS[t];
              if (!config) return null;
              return (
                <Button
                  key={t}
                  variant={config.variant}
                  size="sm"
                  loading={loading}
                  onClick={() =>
                    t === "CANCELLED" ? setCancelModal(true) : changeStatus(t)
                  }
                >
                  {config.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary-500" />
                Detalles del Tour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-warm-400 uppercase">Fecha</p>
                  <p className="font-medium text-warm-900">
                    {tourDate.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-warm-400 uppercase">Hora</p>
                  <p className="font-medium text-warm-900 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {booking.departureTime}
                  </p>
                </div>
              </div>
              {booking.pickupPoint && (
                <div>
                  <p className="text-xs text-warm-400 uppercase">Punto de Recogida</p>
                  <p className="font-medium text-warm-900 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {booking.pickupPoint}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-warm-400 uppercase">Vendedor</p>
                  <p className="text-sm font-medium">{booking.seller.firstName} {booking.seller.lastName}</p>
                </div>
                {booking.guide && (
                  <div>
                    <p className="text-xs text-warm-400 uppercase">Guía</p>
                    <p className="text-sm font-medium">{booking.guide.firstName} {booking.guide.lastName}</p>
                  </div>
                )}
                {booking.vehicle && (
                  <div>
                    <p className="text-xs text-warm-400 uppercase">Vehículo</p>
                    <p className="text-sm font-medium">{booking.vehicle.name || booking.vehicle.plateNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Passengers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary-500" />
                Pasajeros ({booking.passengers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {booking.passengers.map((bp) => (
                  <div key={bp.id} className="flex items-center justify-between rounded-lg bg-warm-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-warm-900">
                          {bp.passenger.firstName} {bp.passenger.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-warm-500">
                          {bp.passenger.nationality && <span>{bp.passenger.nationality}</span>}
                          {bp.passenger.documentNumber && <span>• {bp.passenger.documentNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={bp.paxType === "ADULT" ? "info" : "warning"}>
                        {bp.paxType === "ADULT" ? "Adulto" : "Niño"}
                      </Badge>
                      <span className="text-sm font-medium">${parseFloat(bp.unitPrice).toLocaleString("es-CL")}</span>
                      {bp.checkedIn && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(booking.clientNotes || booking.internalNotes || booking.cancellationReason) && (
            <Card>
              <CardContent className="space-y-3">
                {booking.clientNotes && (
                  <div>
                    <p className="text-xs text-warm-400 uppercase mb-1">Notas del Cliente</p>
                    <p className="text-sm text-warm-700">{booking.clientNotes}</p>
                  </div>
                )}
                {booking.internalNotes && (
                  <div>
                    <p className="text-xs text-warm-400 uppercase mb-1">Notas Internas</p>
                    <p className="text-sm text-warm-700">{booking.internalNotes}</p>
                  </div>
                )}
                {booking.cancellationReason && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-red-500 uppercase mb-1">Motivo de Cancelación</p>
                    <p className="text-sm text-red-700">{booking.cancellationReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-primary-500" />
                Detalle de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-warm-500">{booking.adultCount} Adulto(s)</span>
                <span>${(booking.adultCount * parseFloat(booking.unitPriceAdult)).toLocaleString("es-CL")}</span>
              </div>
              {booking.childCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500">{booking.childCount} Niño(s)</span>
                  <span>${(booking.childCount * parseFloat(booking.unitPriceChild)).toLocaleString("es-CL")}</span>
                </div>
              )}
              <div className="border-t border-warm-200 pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary-600">
                  ${parseFloat(booking.totalAmount).toLocaleString("es-CL")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary-500" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.statusHistory.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${
                        h.toStatus === "CANCELLED" ? "bg-red-400" :
                        h.toStatus === "CONFIRMED" ? "bg-emerald-400" :
                        h.toStatus === "COMPLETED" ? "bg-indigo-400" :
                        h.toStatus === "PAID" ? "bg-green-400" :
                        "bg-warm-300"
                      }`} />
                      {i < booking.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-warm-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-warm-900">
                        {BOOKING_STATUS_LABELS[h.toStatus as BookingStatus]}
                      </p>
                      <p className="text-xs text-warm-400">
                        {new Date(h.createdAt).toLocaleDateString("es-CL", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {h.reason && (
                        <p className="text-xs text-warm-500 mt-0.5">{h.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vouchers */}
          {canGenerateVoucher && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ticket className="h-4 w-4 text-primary-500" />
                  Vouchers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start gap-2"
                  loading={generatingVoucher}
                  onClick={() => generateVoucher("BOARDING")}
                >
                  <Ticket className="h-4 w-4" />
                  Voucher de Embarque
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start gap-2"
                  loading={generatingVoucher}
                  onClick={() => generateVoucher("COMMERCIAL")}
                >
                  <FileText className="h-4 w-4" />
                  Voucher Comercial
                </Button>
                <p className="text-[10px] text-warm-400 text-center pt-1">
                  Se abrirá en nueva pestaña para imprimir
                </p>
              </CardContent>
            </Card>
          )}
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4 text-primary-500" />
                Notificar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start gap-2"
                loading={sendingEmail}
                disabled={passengerEmails.length === 0 || emailSent}
                onClick={sendBookingEmail}
              >
                {emailSent ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {emailSent ? "Email Enviado" : "Enviar Email"}
              </Button>
              {passengerEmails.length === 0 && (
                <p className="text-[10px] text-amber-600">Sin emails de pasajeros registrados</p>
              )}

              {passengerPhones.length > 0 && (
                <div className="border-t border-warm-200 pt-2 mt-2">
                  <p className="text-xs text-warm-500 mb-1.5">Enviar por WhatsApp</p>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.passengers
                      .filter((bp) => bp.passenger.phone)
                      .map((bp) => (
                        <a
                          key={bp.id}
                          href={`https://wa.me/${bp.passenger.phone!.replace(/[^0-9]/g, "")}?text=${buildWhatsAppMessage()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {bp.passenger.firstName}
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {passengerPhones.length > 0 && (
                <div className="border-t border-warm-200 pt-2 mt-2">
                  <p className="text-xs text-warm-500 mb-1.5">Llamar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.passengers
                      .filter((bp) => bp.passenger.phone)
                      .map((bp) => (
                        <a
                          key={bp.id}
                          href={`tel:${bp.passenger.phone}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {bp.passenger.firstName}
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar Reserva" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              Esta acción no se puede deshacer. La reserva quedará cancelada permanentemente.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-warm-700">Motivo de cancelación</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm resize-none focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="Escribe el motivo..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelModal(false)}>Volver</Button>
            <Button variant="danger" onClick={() => changeStatus("CANCELLED", cancelReason)} loading={loading}>
              <XCircle className="h-4 w-4" />
              Confirmar Cancelación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
