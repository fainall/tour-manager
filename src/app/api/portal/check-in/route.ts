import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, passengerIds } = body as {
    token: string;
    passengerIds: string[];
  };

  if (!token || !passengerIds?.length) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { checkInToken: token },
    select: { id: true, status: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  await prisma.bookingPassenger.updateMany({
    where: {
      bookingId: booking.id,
      id: { in: passengerIds },
    },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  const passengers = await prisma.bookingPassenger.findMany({
    where: { bookingId: booking.id },
    include: {
      passenger: {
        select: { firstName: true, lastName: true, nationality: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    passengers: passengers.map((bp) => ({
      id: bp.id,
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      nationality: bp.passenger.nationality,
      paxType: bp.paxType,
      checkedIn: bp.checkedIn,
      checkedInAt: bp.checkedInAt?.toISOString() ?? null,
    })),
  });
}
