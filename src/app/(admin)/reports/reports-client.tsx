"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  Map,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Download,
  Filter,
  Percent,
  UserCheck,
  Ban,
  Wallet,
} from "lucide-react";

type ReportData = {
  period: { from: string; to: string };
  summary: {
    totalBookings: number;
    totalBookingsIncCancelled: number;
    cancelledCount: number;
    cancellationRate: number;
    totalRevenue: number;
    totalCollected: number;
    pendingCollection: number;
    avgTicket: number;
    avgPaxPerBooking: number;
    totalPax: number;
    totalAdults: number;
    totalChildren: number;
    checkInRate: number;
  };
  revenueByDay: { date: string; revenue: number; bookings: number; pax: number }[];
  topTours: { id: string; name: string; bookings: number; revenue: number; pax: number }[];
  sellerRanking: { id: string; name: string; bookings: number; revenue: number; pax: number }[];
  statusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
};

const STATUS_LABELS: Record<string, string> = {
  RESERVED: "Reservada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No Show",
};

const STATUS_COLORS: Record<string, string> = {
  RESERVED: "bg-amber-500",
  CONFIRMED: "bg-emerald-500",
  COMPLETED: "bg-indigo-500",
  PAID: "bg-green-500",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-warm-400",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "T. Crédito",
  DEBIT_CARD: "T. Débito",
  BANK_TRANSFER: "Transferencia",
  DIGITAL_WALLET: "Wallet",
  PAYPAL: "PayPal",
  TRANSBANK: "Transbank",
  OTHER: "Otro",
};

function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDefaultDates() {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

const QUICK_RANGES = [
  { label: "Hoy", getValue: () => { const d = new Date().toISOString().split("T")[0]; return { from: d, to: d }; } },
  { label: "Esta semana", getValue: () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: monday.toISOString().split("T")[0], to: sunday.toISOString().split("T")[0] };
  }},
  { label: "Este mes", getValue: getDefaultDates },
  { label: "Últimos 30 días", getValue: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
  }},
  { label: "Últimos 90 días", getValue: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
  }},
];

export default function ReportsClient() {
  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState("Este mes");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function applyRange(label: string) {
    const range = QUICK_RANGES.find((r) => r.label === label);
    if (range) {
      const { from: f, to: t } = range.getValue();
      setFrom(f);
      setTo(t);
      setActiveRange(label);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;
  const maxDayRevenue = Math.max(...data.revenueByDay.map((d) => d.revenue), 1);
  const maxTourRevenue = Math.max(...data.topTours.map((t) => t.revenue), 1);
  const maxSellerRevenue = Math.max(...data.sellerRanking.map((s) => s.revenue), 1);
  const totalStatusCount = Object.values(data.statusBreakdown).reduce((a, b) => a + b, 0) || 1;
  const totalPaymentAmount = Object.values(data.paymentMethodBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Reportes</h1>
          <p className="mt-1 text-sm text-warm-500">
            Análisis de tu operación de tours
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const csvRows = ["Fecha,Ingresos,Reservas,Pasajeros"];
            data.revenueByDay.forEach((d) => {
              csvRows.push(`${d.date},${d.revenue},${d.bookings},${d.pax}`);
            });
            const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reporte-${from}-a-${to}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-warm-700">
            <Filter className="h-4 w-4" />
            Período
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => applyRange(r.label)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeRange === r.label
                    ? "bg-primary-500 text-white"
                    : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setActiveRange(""); }}
              className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm text-warm-700 focus:border-primary-500 focus:outline-none"
            />
            <span className="text-sm text-warm-400">a</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setActiveRange(""); }}
              className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm text-warm-700 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard icon={DollarSign} label="Ingresos" value={formatCLP(summary.totalRevenue)} color="emerald" />
        <KPICard icon={Wallet} label="Cobrado" value={formatCLP(summary.totalCollected)} color="green" />
        <KPICard icon={CalendarCheck} label="Reservas" value={String(summary.totalBookings)} color="primary" />
        <KPICard icon={Users} label="Pasajeros" value={String(summary.totalPax)} subValue={`${summary.totalAdults}A + ${summary.totalChildren}N`} color="secondary" />
        <KPICard icon={TrendingUp} label="Ticket prom." value={formatCLP(summary.avgTicket)} color="indigo" />
        <KPICard icon={UserCheck} label="Check-in" value={`${summary.checkInRate}%`} color="teal" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniKPI icon={Ban} label="Canceladas" value={String(summary.cancelledCount)} sub={`${summary.cancellationRate}% tasa`} negative />
        <MiniKPI icon={CreditCard} label="Por cobrar" value={formatCLP(summary.pendingCollection)} sub="pendiente" />
        <MiniKPI icon={Users} label="PAX/reserva" value={String(summary.avgPaxPerBooking)} sub="promedio" />
        <MiniKPI icon={Percent} label="Tasa check-in" value={`${summary.checkInRate}%`} sub={`${summary.totalPax} total`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-warm-900">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              Ingresos por día
            </h3>
          </div>
          <CardContent className="pt-0">
            {data.revenueByDay.length === 0 ? (
              <EmptyState text="Sin datos para este período" />
            ) : (
              <div className="space-y-2">
                {data.revenueByDay.slice(-15).map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs text-warm-500">
                      {formatShortDate(d.date)}
                    </span>
                    <div className="flex-1">
                      <div className="relative h-6 w-full overflow-hidden rounded-md bg-warm-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500"
                          style={{ width: `${(d.revenue / maxDayRevenue) * 100}%` }}
                        />
                        <span className="relative z-10 flex h-full items-center px-2 text-xs font-medium text-warm-800">
                          {formatCLP(d.revenue)}
                        </span>
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs text-warm-400">
                      {d.pax} pax
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-warm-900">
              <CalendarCheck className="h-5 w-5 text-secondary-500" />
              Estado de reservas
            </h3>
          </div>
          <CardContent className="pt-0">
            <div className="mb-4 flex h-4 overflow-hidden rounded-full bg-warm-100">
              {Object.entries(data.statusBreakdown).map(([status, count]) => (
                <div
                  key={status}
                  className={`${STATUS_COLORS[status] || "bg-warm-300"} transition-all duration-500`}
                  style={{ width: `${(count / totalStatusCount) * 100}%` }}
                  title={`${STATUS_LABELS[status] || status}: ${count}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(data.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[status] || "bg-warm-300"}`} />
                  <span className="text-xs text-warm-600">
                    {STATUS_LABELS[status] || status}: <strong>{count}</strong>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tours & Sellers Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Top Tours */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-warm-900">
              <Map className="h-5 w-5 text-accent-500" />
              Tours más vendidos
            </h3>
          </div>
          <CardContent className="pt-0">
            {data.topTours.length === 0 ? (
              <EmptyState text="Sin tours en este período" />
            ) : (
              <div className="space-y-3">
                {data.topTours.slice(0, 8).map((tour, i) => (
                  <div key={tour.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-amber-100 text-amber-700" :
                          i === 1 ? "bg-warm-200 text-warm-600" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-warm-100 text-warm-500"
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-warm-800 truncate max-w-[200px]">
                          {tour.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-warm-500">
                        <span>{tour.bookings} res.</span>
                        <span>{tour.pax} pax</span>
                        <span className="font-semibold text-warm-800">{formatCLP(tour.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-500"
                        style={{ width: `${(tour.revenue / maxTourRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seller Ranking */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-warm-900">
              <Award className="h-5 w-5 text-amber-500" />
              Ranking de vendedores
            </h3>
          </div>
          <CardContent className="pt-0">
            {data.sellerRanking.length === 0 ? (
              <EmptyState text="Sin vendedores en este período" />
            ) : (
              <div className="space-y-3">
                {data.sellerRanking.map((seller, i) => (
                  <div key={seller.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-amber-100 text-amber-700" :
                          i === 1 ? "bg-warm-200 text-warm-600" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-warm-100 text-warm-500"
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-warm-800">
                          {seller.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-warm-500">
                        <span>{seller.bookings} res.</span>
                        <span>{seller.pax} pax</span>
                        <span className="font-semibold text-warm-800">{formatCLP(seller.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${(seller.revenue / maxSellerRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      {Object.keys(data.paymentMethodBreakdown).length > 0 && (
        <Card>
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-warm-900">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              Medios de pago
            </h3>
          </div>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(data.paymentMethodBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => (
                  <div key={method} className="rounded-xl border border-warm-100 p-3 text-center">
                    <p className="text-xs text-warm-500">{PAYMENT_LABELS[method] || method}</p>
                    <p className="mt-1 text-lg font-bold text-warm-900">{formatCLP(amount)}</p>
                    <p className="text-xs text-warm-400">
                      {Math.round((amount / totalPaymentAmount) * 100)}%
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-warm-900 px-4 py-2 text-sm text-white shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando...
        </div>
      )}
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    emerald: "bg-emerald-50",
    green: "bg-green-50",
    primary: "bg-primary-50",
    secondary: "bg-secondary-50",
    indigo: "bg-indigo-50",
    teal: "bg-teal-50",
  };
  const textMap: Record<string, string> = {
    emerald: "text-emerald-600",
    green: "text-green-600",
    primary: "text-primary-600",
    secondary: "text-secondary-600",
    indigo: "text-indigo-600",
    teal: "text-teal-600",
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-4 text-center">
        <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${bgMap[color]}`}>
          <Icon className={`h-5 w-5 ${textMap[color]}`} />
        </div>
        <p className="text-xs text-warm-500">{label}</p>
        <p className="text-lg font-bold text-warm-900">{value}</p>
        {subValue && <p className="text-[10px] text-warm-400">{subValue}</p>}
      </CardContent>
    </Card>
  );
}

function MiniKPI({
  icon: Icon,
  label,
  value,
  sub,
  negative,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-warm-100 p-3">
      <Icon className={`h-4 w-4 shrink-0 ${negative ? "text-red-400" : "text-warm-400"}`} />
      <div>
        <p className="text-sm font-semibold text-warm-800">{value}</p>
        <p className="text-[10px] text-warm-400">{label} · {sub}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <BarChart3 className="mb-2 h-8 w-8 text-warm-300" />
      <p className="text-sm text-warm-400">{text}</p>
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const months = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(d)} ${months[parseInt(m)]}`;
}
