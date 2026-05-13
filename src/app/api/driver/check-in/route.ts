import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const driverId = request.cookies.get("driver-session")?.value;
  if (!driverId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { bookingPassengerId, checkedIn } = (await request.json()) as {
    bookingPassengerId: string;
    checkedIn: boolean;
  };

  if (!bookingPassengerId) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const bp = await prisma.bookingPassenger.findUnique({
    where: { id: bookingPassengerId },
    include: { booking: { select: { driverId: true, guideId: true } } },
  });

  if (!bp || (bp.booking.driverId !== driverId && bp.booking.guideId !== driverId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.bookingPassenger.update({
    where: { id: bookingPassengerId },
    data: {
      checkedIn,
      checkedInAt: checkedIn ? new Date() : null,
    },
  });

  return NextResponse.json({ success: true });
}
