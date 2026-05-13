import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "Parámetro date requerido" }, { status: 400 });
  }

  const date = new Date(dateStr);
  const nextDay = new Date(dateStr);
  nextDay.setDate(nextDay.getDate() + 1);

  const [bookings, guides, drivers, vehicles] = await Promise.all([
    prisma.booking.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED"] },
        tourDate: { gte: date, lt: nextDay },
      },
      include: {
        tour: { select: { name: true, durationMinutes: true } },
        seller: { select: { firstName: true, lastName: true } },
        guide: { select: { id: true, firstName: true, lastName: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, name: true, plateNumber: true, capacity: true } },
      },
      orderBy: [{ departureTime: "asc" }],
    }),
    prisma.user.findMany({
      where: { role: "GUIDE", isActive: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "DRIVER", isActive: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.vehicle.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, plateNumber: true, capacity: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = bookings.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    tourName: b.tour.name,
    tourDuration: b.tour.durationMinutes,
    departureTime: b.departureTime,
    status: b.status,
    adultCount: b.adultCount,
    childCount: b.childCount,
    totalPax: b.adultCount + b.childCount,
    totalAmount: b.totalAmount.toString(),
    sellerName: `${b.seller.firstName} ${b.seller.lastName}`,
    guideId: b.guideId,
    guideName: b.guide ? `${b.guide.firstName} ${b.guide.lastName}` : null,
    driverId: b.driverId,
    driverName: b.driver ? `${b.driver.firstName} ${b.driver.lastName}` : null,
    vehicleId: b.vehicleId,
    vehicleName: b.vehicle ? (b.vehicle.name || b.vehicle.plateNumber) : null,
    vehiclePlate: b.vehicle?.plateNumber ?? null,
    vehicleCapacity: b.vehicle?.capacity ?? null,
  }));

  return NextResponse.json({
    bookings: serialized,
    guides,
    drivers,
    vehicles,
  });
}
