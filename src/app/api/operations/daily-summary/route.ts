import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  let dateOnly: Date;
  if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    dateOnly = new Date(y, m - 1, d);
  } else {
    const now = new Date();
    dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const bookings = await prisma.booking.findMany({
    where: {
      tourDate: dateOnly,
      deletedAt: null,
      status: { notIn: ["CANCELLED"] },
    },
    include: {
      tour: { select: { name: true, durationMinutes: true } },
      driver: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true, plateNumber: true, capacity: true } },
      passengers: { select: { checkedIn: true, paxType: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  const totalBookings = bookings.length;
  const totalPax = bookings.reduce((s, b) => s + b.adultCount + b.childCount, 0);
  const totalAdults = bookings.reduce((s, b) => s + b.adultCount, 0);
  const totalChildren = bookings.reduce((s, b) => s + b.childCount, 0);
  const totalCheckedIn = bookings.reduce(
    (s, b) => s + b.passengers.filter((p) => p.checkedIn).length,
    0
  );

  const uniqueDrivers = new Set(bookings.map((b) => b.driverId).filter(Boolean));
  const uniqueGuides = new Set(bookings.map((b) => b.guideId).filter(Boolean));
  const uniqueVehicles = new Set(bookings.map((b) => b.vehicleId).filter(Boolean));

  const tourBreakdown = bookings.reduce(
    (acc, b) => {
      const key = b.tour.name;
      if (!acc[key]) acc[key] = { pax: 0, bookings: 0 };
      acc[key].pax += b.adultCount + b.childCount;
      acc[key].bookings += 1;
      return acc;
    },
    {} as Record<string, { pax: number; bookings: number }>
  );

  const timeline = bookings.map((b) => ({
    time: b.departureTime,
    tour: b.tour.name,
    bookingNumber: b.bookingNumber,
    pax: b.adultCount + b.childCount,
    checkedIn: b.passengers.filter((p) => p.checkedIn).length,
    driver: b.driver
      ? `${b.driver.firstName} ${b.driver.lastName}`
      : null,
    guide: b.guide
      ? `${b.guide.firstName} ${b.guide.lastName}`
      : null,
    vehicle: b.vehicle?.name ?? null,
    status: b.status,
  }));

  return NextResponse.json({
    date: dateParam ?? dateOnly.toISOString().split("T")[0],
    summary: {
      totalBookings,
      totalPax,
      totalAdults,
      totalChildren,
      totalCheckedIn,
      checkInRate: totalPax > 0 ? Math.round((totalCheckedIn / totalPax) * 100) : 0,
      activeDrivers: uniqueDrivers.size,
      activeGuides: uniqueGuides.size,
      vehiclesInUse: uniqueVehicles.size,
    },
    tourBreakdown,
    timeline,
  });
}
