import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookingWizard } from "./booking-wizard";

export default async function NewBookingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [tours, guides, drivers, vehicles] = await Promise.all([
    prisma.tour.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        category: true,
        schedules: { where: { isActive: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "GUIDE", isActive: true, deletedAt: null },
      orderBy: { firstName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "DRIVER", isActive: true, deletedAt: null },
      orderBy: { firstName: "asc" },
    }),
    prisma.vehicle.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  const toursData = tours.map((t) => ({
    id: t.id,
    name: t.name,
    categoryName: t.category?.name ?? null,
    durationMinutes: t.durationMinutes,
    priceAdult: t.priceAdult.toString(),
    priceChild: t.priceChild.toString(),
    minPriceAdult: t.minPriceAdult?.toString() ?? null,
    minPriceChild: t.minPriceChild?.toString() ?? null,
    maxPax: t.maxPax,
    meetingPoint: t.meetingPoint,
    schedules: t.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      departureTime: s.departureTime,
    })),
  }));

  const staffData = {
    guides: guides.map((g) => ({ value: g.id, label: `${g.firstName} ${g.lastName}` })),
    drivers: drivers.map((d) => ({ value: d.id, label: `${d.firstName} ${d.lastName}` })),
    vehicles: vehicles.map((v) => ({ value: v.id, label: `${v.name || v.plateNumber} (${v.capacity} PAX)` })),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/bookings"
          className="rounded-lg p-2 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Nueva Reserva</h1>
          <p className="mt-0.5 text-sm text-warm-500">
            Crea una nueva reserva paso a paso
          </p>
        </div>
      </div>
      <BookingWizard tours={toursData} staff={staffData} />
    </div>
  );
}
