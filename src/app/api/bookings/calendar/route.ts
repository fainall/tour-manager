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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parámetros from/to requeridos" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED"] },
      tourDate: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    include: {
      tour: { select: { name: true } },
      seller: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
      passengers: { select: { paxType: true } },
    },
    orderBy: [{ tourDate: "asc" }, { departureTime: "asc" }],
  });

  const serialized = bookings.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    tourName: b.tour.name,
    tourDate: b.tourDate.toISOString().split("T")[0],
    departureTime: b.departureTime,
    status: b.status,
    adultCount: b.adultCount,
    childCount: b.childCount,
    totalPax: b.adultCount + b.childCount,
    totalAmount: b.totalAmount.toString(),
    sellerName: `${b.seller.firstName} ${b.seller.lastName}`,
    guideName: b.guide ? `${b.guide.firstName} ${b.guide.lastName}` : null,
  }));

  return NextResponse.json(serialized);
}
