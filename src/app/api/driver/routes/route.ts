import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const driverId = request.cookies.get("driver-session")?.value;
  if (!driverId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
      driverId,
      tourDate: dateOnly,
      deletedAt: null,
      status: { notIn: ["CANCELLED"] },
    },
    include: {
      tour: {
        select: {
          name: true,
          durationMinutes: true,
          meetingPoint: true,
          meetingPointLat: true,
          meetingPointLng: true,
        },
      },
      guide: { select: { firstName: true, lastName: true, phone: true } },
      vehicle: { select: { name: true, plateNumber: true, capacity: true } },
      passengers: {
        include: {
          passenger: {
            select: {
              firstName: true,
              lastName: true,
              nationality: true,
              phone: true,
              specialNeeds: true,
              notes: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { departureTime: "asc" },
  });

  // Also fetch bookings where user is guide
  const guideBookings = await prisma.booking.findMany({
    where: {
      guideId: driverId,
      tourDate: dateOnly,
      deletedAt: null,
      status: { notIn: ["CANCELLED"] },
    },
    include: {
      tour: {
        select: {
          name: true,
          durationMinutes: true,
          meetingPoint: true,
          meetingPointLat: true,
          meetingPointLng: true,
        },
      },
      driver: { select: { firstName: true, lastName: true, phone: true } },
      vehicle: { select: { name: true, plateNumber: true, capacity: true } },
      passengers: {
        include: {
          passenger: {
            select: {
              firstName: true,
              lastName: true,
              nationality: true,
              phone: true,
              specialNeeds: true,
              notes: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { departureTime: "asc" },
  });

  const allBookingIds = new Set(bookings.map((b) => b.id));
  const mergedBookings = [
    ...bookings,
    ...guideBookings.filter((b) => !allBookingIds.has(b.id)),
  ].sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  const routes = mergedBookings.map((b) => {
    const isDriver = b.driverId === driverId;
    const isGuide = b.guideId === driverId;

    return {
      id: b.id,
      bookingNumber: b.bookingNumber,
      tourName: b.tour.name,
      departureTime: b.departureTime,
      duration: b.tour.durationMinutes,
      status: b.status,
      role: isDriver && isGuide ? "DRIVER_GUIDE" : isDriver ? "DRIVER" : "GUIDE",
      meetingPoint: b.pickupPoint ?? b.tour.meetingPoint,
      meetingPointLat: (b.pickupLat ?? b.tour.meetingPointLat)?.toString() ?? null,
      meetingPointLng: (b.pickupLng ?? b.tour.meetingPointLng)?.toString() ?? null,
      totalPax: b.adultCount + b.childCount,
      checkedInCount: b.passengers.filter((bp) => bp.checkedIn).length,
      vehicle: b.vehicle
        ? { name: b.vehicle.name, plate: b.vehicle.plateNumber, capacity: b.vehicle.capacity }
        : null,
      guide: "guide" in b && b.guide
        ? { name: `${b.guide.firstName} ${b.guide.lastName}`, phone: b.guide.phone }
        : null,
      driver: "driver" in b && b.driver
        ? { name: `${b.driver.firstName} ${b.driver.lastName}`, phone: b.driver.phone }
        : null,
      clientNotes: b.clientNotes,
      passengers: b.passengers.map((bp) => ({
        id: bp.id,
        name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
        nationality: bp.passenger.nationality,
        phone: bp.passenger.phone,
        paxType: bp.paxType,
        seatNumber: bp.seatNumber,
        checkedIn: bp.checkedIn,
        specialNeeds: bp.passenger.specialNeeds && typeof bp.passenger.specialNeeds === "object"
          ? (Object.keys(bp.passenger.specialNeeds).length > 0 ? JSON.stringify(bp.passenger.specialNeeds) : null)
          : (bp.passenger.specialNeeds || null),
        notes: bp.passenger.notes,
      })),
    };
  });

  return NextResponse.json({ routes });
}
