import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarCheck,
  DollarSign,
  Clock,
  Map,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Circle,
  Navigation,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, pendingConfirmations, activeTours, todayRevenue] =
    await Promise.all([
      prisma.booking.count({
        where: {
          tourDate: { gte: today, lt: tomorrow },
          status: { not: "CANCELLED" },
          deletedAt: null,
        },
      }),
      prisma.booking.count({
        where: {
          status: "RESERVED",
          deletedAt: null,
        },
      }),
      prisma.tour.count({
        where: { isActive: true, deletedAt: null },
      }),
      prisma.booking.aggregate({
        where: {
          tourDate: { gte: today, lt: tomorrow },
          status: { not: "CANCELLED" },
          deletedAt: null,
        },
        _sum: { totalAmount: true },
      }),
    ]);

  return {
    todayBookings,
    pendingConfirmations,
    activeTours,
    todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
  };
}

const METRICS = [
  {
    label: "Reservas hoy",
    icon: CalendarCheck,
    color: "text-primary-500",
    bgColor: "bg-primary-50",
    key: "todayBookings" as const,
    format: (v: number) => String(v),
  },
  {
    label: "Ingresos del día",
    icon: DollarSign,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    key: "todayRevenue" as const,
    format: (v: number) => formatCurrency(v),
  },
  {
    label: "Pendientes confirmar",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    key: "pendingConfirmations" as const,
    format: (v: number) => String(v),
  },
  {
    label: "Tours activos",
    icon: Map,
    color: "text-secondary-500",
    bgColor: "bg-secondary-50",
    key: "activeTours" as const,
    format: (v: number) => String(v),
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  const greeting = getGreeting();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 lg:text-3xl">
            {greeting}, {session?.user.firstName}
          </h1>
          <p className="mt-1 text-sm text-warm-500">
            Aquí tienes un resumen de tu operación de hoy
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/bookings/new">
            <Button size="md">
              <Plus className="h-4 w-4" />
              Nueva Reserva
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="secondary" size="md">
              <Calendar className="h-4 w-4" />
              Calendario
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.key} className="hover:shadow-card-hover transition-shadow">
            <CardContent className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${metric.bgColor}`}
              >
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm text-warm-500">{metric.label}</p>
                <p className="text-2xl font-bold text-warm-900">
                  {metric.format(data[metric.key])}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Operations Timeline */}
      <Card>
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-semibold text-warm-900">
              Operaciones en vivo
            </h2>
          </div>
          <Link
            href="/operations"
            className="text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            Ver todo
          </Link>
        </div>
        <CardContent className="pt-0">
          <TodayTimeline />
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-semibold text-warm-900">
              Reservas recientes
            </h2>
            <Link
              href="/bookings"
              className="text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              Ver todas
            </Link>
          </div>
          <CardContent className="pt-0">
            <RecentBookings />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold text-warm-900">
              Acciones rápidas
            </h2>
          </div>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <Link
                href="/bookings/new"
                className="flex items-center gap-3 rounded-lg border border-warm-200 p-3 transition-colors hover:bg-warm-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <Plus className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-900">
                    Nueva Reserva
                  </p>
                  <p className="text-xs text-warm-500">
                    Crear una nueva reserva
                  </p>
                </div>
              </Link>
              <Link
                href="/tours"
                className="flex items-center gap-3 rounded-lg border border-warm-200 p-3 transition-colors hover:bg-warm-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50">
                  <Map className="h-5 w-5 text-secondary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-900">
                    Gestionar Tours
                  </p>
                  <p className="text-xs text-warm-500">
                    Catálogo de tours
                  </p>
                </div>
              </Link>
              <Link
                href="/passengers"
                className="flex items-center gap-3 rounded-lg border border-warm-200 p-3 transition-colors hover:bg-warm-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50">
                  <CalendarCheck className="h-5 w-5 text-accent-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-900">
                    Buscar Pasajeros
                  </p>
                  <p className="text-xs text-warm-500">
                    Buscar por nombre o documento
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function RecentBookings() {
  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null },
    include: {
      tour: { select: { name: true } },
      seller: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const statusVariantMap: Record<string, "warning" | "success" | "secondary" | "primary" | "danger" | "neutral"> = {
    RESERVED: "warning",
    CONFIRMED: "success",
    COMPLETED: "secondary",
    PAID: "primary",
    CANCELLED: "danger",
    NO_SHOW: "neutral",
  };

  const statusLabels: Record<string, string> = {
    RESERVED: "Reservada",
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
    PAID: "Pagada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No Show",
  };

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CalendarCheck className="mb-3 h-10 w-10 text-warm-300" />
        <p className="text-sm text-warm-500">No hay reservas aún</p>
        <Link href="/bookings/new" className="mt-2 text-sm font-medium text-primary-500">
          Crear la primera reserva
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Link
          key={booking.id}
          href={`/bookings/${booking.id}`}
          className="flex items-center justify-between rounded-lg border border-warm-100 p-3 transition-colors hover:bg-warm-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warm-100 text-xs font-bold text-warm-600">
              #{booking.bookingNumber}
            </div>
            <div>
              <p className="text-sm font-medium text-warm-900">
                {booking.tour.name}
              </p>
              <p className="text-xs text-warm-500">
                {new Date(booking.tourDate).toLocaleDateString("es-CL")} · {booking.adultCount + booking.childCount} PAX · {booking.seller.firstName} {booking.seller.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-warm-900 sm:block">
              {formatCurrency(Number(booking.totalAmount))}
            </span>
            <Badge variant={statusVariantMap[booking.status]} dot>
              {statusLabels[booking.status]}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function TodayTimeline() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      tourDate: { gte: today, lt: tomorrow },
      status: { not: "CANCELLED" },
      deletedAt: null,
    },
    include: {
      tour: { select: { name: true } },
      driver: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true, capacity: true } },
      passengers: { select: { checkedIn: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="mb-3 h-10 w-10 text-warm-300" />
        <p className="text-sm text-warm-500">No hay tours programados para hoy</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const totalPax = b.adultCount + b.childCount;
        const checkedIn = b.passengers.filter((p) => p.checkedIn).length;
        const pct = totalPax > 0 ? Math.round((checkedIn / totalPax) * 100) : 0;
        const allDone = checkedIn === totalPax && totalPax > 0;

        return (
          <Link
            key={b.id}
            href={`/bookings/${b.id}`}
            className="flex items-center gap-4 rounded-xl border border-warm-100 p-3 hover:bg-warm-50 transition-colors"
          >
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-warm-900">{b.departureTime}</span>
              <span className="text-[10px] text-warm-400">hrs</span>
            </div>

            <div className="h-10 w-px bg-warm-200" />

            <div className="flex-1 min-w-0">
              <p className="font-medium text-warm-900 text-sm truncate">{b.tour.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-warm-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {checkedIn}/{totalPax}
                </span>
                {b.driver && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {b.driver.firstName}
                  </span>
                )}
                {b.guide && (
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {b.guide.firstName}
                  </span>
                )}
                {b.vehicle && (
                  <span className="hidden sm:inline">🚐 {b.vehicle.name}</span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div className="hidden sm:block w-20 h-1.5 rounded-full bg-warm-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${allDone ? "bg-emerald-500" : "bg-primary-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {allDone ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-warm-300" />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}
