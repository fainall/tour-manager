import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
    include: {
      tour: {
        select: {
          name: true,
          description: true,
          durationMinutes: true,
          meetingPoint: true,
          includedItems: true,
          excludedItems: true,
        },
      },
      guide: { select: { firstName: true } },
      vehicle: { select: { name: true } },
      passengers: {
        include: {
          passenger: {
            select: { firstName: true, lastName: true, nationality: true },
          },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    bookingNumber: booking.bookingNumber,
    tourName: booking.tour.name,
    tourDescription: booking.tour.description,
    tourDuration: booking.tour.durationMinutes,
    meetingPoint: booking.tour.meetingPoint,
    includedItems: booking.tour.includedItems,
    excludedItems: booking.tour.excludedItems,
    tourDate: `${booking.tourDate.getFullYear()}-${String(booking.tourDate.getMonth() + 1).padStart(2, "0")}-${String(booking.tourDate.getDate()).padStart(2, "0")}`,
    departureTime: booking.departureTime,
    pickupPoint: booking.pickupPoint,
    status: booking.status,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    totalPax: booking.adultCount + booking.childCount,
    totalAmount: booking.totalAmount.toString(),
    guideName: booking.guide?.firstName ?? null,
    vehicleName: booking.vehicle?.name ?? null,
    clientNotes: booking.clientNotes,
    passengers: booking.passengers.map((bp) => ({
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      nationality: bp.passenger.nationality,
      paxType: bp.paxType,
    })),
  });
}
