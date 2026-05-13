import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/lib/constants";
import type { BookingStatus } from "@/generated/prisma/client";

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null },
    include: {
      tour: { select: { name: true } },
      seller: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusVariantMap: Record<BookingStatus, "warning" | "success" | "secondary" | "primary" | "danger" | "neutral"> = {
    RESERVED: "warning",
    CONFIRMED: "success",
    COMPLETED: "secondary",
    PAID: "primary",
    CANCELLED: "danger",
    NO_SHOW: "neutral",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Reservas</h1>
          <p className="mt-1 text-sm text-warm-500">
            {bookings.length} reservas encontradas
          </p>
        </div>
        <Link href="/bookings/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            placeholder="Buscar por número, pasajero o tour..."
            className="h-11 w-full rounded-lg border border-warm-300 bg-white pl-10 pr-4 text-sm placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <Button variant="secondary">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-warm-500">No hay reservas registradas</p>
            <Link href="/bookings/new" className="mt-2 text-sm font-medium text-primary-500">
              Crear la primera reserva
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Tour</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">PAX</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="transition-colors hover:bg-warm-50">
                    <td className="px-6 py-4">
                      <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-primary-500 hover:text-primary-600">
                        #{booking.bookingNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-700">
                      {formatDate(booking.tourDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-warm-900">
                      {booking.tour.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-700">
                      {booking.adultCount + booking.childCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-700">
                      {booking.seller.firstName} {booking.seller.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-warm-900">
                      {formatCurrency(Number(booking.totalAmount))}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariantMap[booking.status]} dot>
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-4 md:hidden">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <div className="rounded-lg border border-warm-200 p-4 transition-colors hover:bg-warm-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary-500">
                      #{booking.bookingNumber}
                    </span>
                    <Badge variant={statusVariantMap[booking.status]} dot>
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 font-medium text-warm-900">{booking.tour.name}</p>
                  <div className="mt-1 flex items-center justify-between text-sm text-warm-500">
                    <span>{formatDate(booking.tourDate)} · {booking.adultCount + booking.childCount} PAX</span>
                    <span className="font-semibold text-warm-900">
                      {formatCurrency(Number(booking.totalAmount))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
