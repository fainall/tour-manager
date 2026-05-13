"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Globe,
  Baby,
  Package,
  Ban,
  Download,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { type Locale, INTL_LOCALE, t } from "../../_i18n";

type Passenger = {
  name: string;
  nationality: string;
  paxType: string;
};

type Booking = {
  bookingNumber: number;
  tourName: string;
  tourDescription: string | null;
  tourDuration: number;
  meetingPoint: string | null;
  includedItems: string[];
  excludedItems: string[];
  tourDate: string;
  departureTime: string;
  pickupPoint: string | null;
  status: string;
  adultCount: number;
  childCount: number;
  totalPax: number;
  guideName: string | null;
  vehicleName: string | null;
  clientNotes: string | null;
  checkInToken: string;
  passengers: Passenger[];
};

const STATUS_MAP: Record<string, { variant: "success" | "warning" | "danger" | "info" | "primary"; icon: typeof CheckCircle2 }> = {
  CONFIRMED: { variant: "success", icon: CheckCircle2 },
  PENDING: { variant: "warning", icon: AlertCircle },
  CANCELLED: { variant: "danger", icon: XCircle },
  COMPLETED: { variant: "primary", icon: CheckCircle2 },
  PAID: { variant: "info", icon: CheckCircle2 },
  RESERVED: { variant: "warning", icon: AlertCircle },
};

function formatDate(dateStr: string, locale: Locale) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(minutes: number, dict: Record<string, string>) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${minutes} min`;
}

function downloadQR() {
  const svg = document.getElementById("checkin-qr");
  if (!svg) return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const data = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement("a");
    a.download = "checkin-qr.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
}

export function BookingDetail({
  booking,
  dict,
  locale,
}: {
  booking: Booking;
  dict: Record<string, string>;
  locale: Locale;
}) {
  const statusInfo = STATUS_MAP[booking.status] ?? STATUS_MAP.PENDING;
  const StatusIcon = statusInfo.icon;
  const checkInUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/check-in/${booking.checkInToken}`;

  return (
    <div className="space-y-6">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(dict, "booking.backToSearch")}
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-white border border-warm-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-100 text-sm">{t(dict, "booking.reserva")} #{booking.bookingNumber}</p>
              <h1 className="mt-1 text-2xl font-bold">{booking.tourName}</h1>
              {booking.tourDescription && (
                <p className="mt-1 text-primary-100 text-sm">{booking.tourDescription}</p>
              )}
            </div>
            <Badge variant={statusInfo.variant} className="shrink-0">
              <StatusIcon className="h-3.5 w-3.5" />
              {t(dict, `status.${booking.status}`)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-warm-100">
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-warm-500">{t(dict, "booking.date")}</p>
              <p className="font-medium text-warm-900 capitalize">{formatDate(booking.tourDate, locale)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-warm-500">{t(dict, "booking.departureTime")}</p>
              <p className="font-medium text-warm-900">{booking.departureTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-warm-500">{t(dict, "booking.meetingPoint")}</p>
              <p className="font-medium text-warm-900">{booking.meetingPoint ?? booking.pickupPoint ?? t(dict, "booking.toBeConfirmed")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Check-in */}
      <div className="rounded-2xl bg-white border border-warm-200 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="rounded-xl bg-white p-3 border-2 border-dashed border-warm-200">
            <QRCodeSVG
              id="checkin-qr"
              value={checkInUrl}
              size={140}
              level="M"
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="font-semibold text-warm-900">{t(dict, "booking.qrTitle")}</h3>
            <p className="mt-1 text-sm text-warm-500">{t(dict, "booking.qrDesc")}</p>
            <button
              onClick={downloadQR}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-warm-100 px-3 py-1.5 text-sm font-medium text-warm-700 hover:bg-warm-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t(dict, "booking.downloadQR")}
            </button>
          </div>
        </div>
      </div>

      {/* Passengers */}
      <div className="rounded-2xl bg-white border border-warm-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-warm-900">
            {t(dict, "booking.passengers")} ({booking.totalPax})
          </h2>
        </div>
        <div className="space-y-3">
          {booking.passengers.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-warm-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-warm-200 text-warm-500">
                  {p.paxType === "CHILD" ? <Baby className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <span className="font-medium text-warm-900">{p.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-warm-500">
                <Globe className="h-3.5 w-3.5" />
                {p.nationality}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tour info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-warm-200 p-5 text-center">
          <Clock className="mx-auto h-6 w-6 text-primary-500 mb-2" />
          <p className="text-xs text-warm-500">{t(dict, "booking.duration")}</p>
          <p className="mt-0.5 font-semibold text-warm-900">{formatDuration(booking.tourDuration, dict)}</p>
        </div>
        {booking.guideName && (
          <div className="rounded-2xl bg-white border border-warm-200 p-5 text-center">
            <User className="mx-auto h-6 w-6 text-primary-500 mb-2" />
            <p className="text-xs text-warm-500">{t(dict, "booking.guide")}</p>
            <p className="mt-0.5 font-semibold text-warm-900">{booking.guideName}</p>
          </div>
        )}
        {booking.vehicleName && (
          <div className="rounded-2xl bg-white border border-warm-200 p-5 text-center">
            <Package className="mx-auto h-6 w-6 text-primary-500 mb-2" />
            <p className="text-xs text-warm-500">{t(dict, "booking.vehicle")}</p>
            <p className="mt-0.5 font-semibold text-warm-900">{booking.vehicleName}</p>
          </div>
        )}
      </div>

      {/* Included / Excluded */}
      {(booking.includedItems.length > 0 || booking.excludedItems.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {booking.includedItems.length > 0 && (
            <div className="rounded-2xl bg-white border border-warm-200 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-warm-900 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {t(dict, "booking.includes")}
              </h3>
              <ul className="space-y-2">
                {booking.includedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {booking.excludedItems.length > 0 && (
            <div className="rounded-2xl bg-white border border-warm-200 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-warm-900 mb-3">
                <Ban className="h-5 w-5 text-red-500" />
                {t(dict, "booking.excludes")}
              </h3>
              <ul className="space-y-2">
                {booking.excludedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-500">
                    <Ban className="h-4 w-4 shrink-0 text-red-300 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Client notes */}
      {booking.clientNotes && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
          <h3 className="flex items-center gap-2 font-semibold text-amber-900 mb-2">
            <AlertCircle className="h-5 w-5" />
            {t(dict, "booking.notes")}
          </h3>
          <p className="text-sm text-amber-800">{booking.clientNotes}</p>
        </div>
      )}
    </div>
  );
}
