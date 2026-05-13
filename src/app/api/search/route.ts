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
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ bookings: [], passengers: [], tours: [] });
  }

  const isNumber = /^\d+$/.test(q);

  const [bookings, passengers, tours] = await Promise.all([
    prisma.booking.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(isNumber ? [{ bookingNumber: parseInt(q) }] : []),
          { tour: { name: { contains: q, mode: "insensitive" as const } } },
          { seller: { firstName: { contains: q, mode: "insensitive" as const } } },
          { seller: { lastName: { contains: q, mode: "insensitive" as const } } },
        ],
      },
      include: {
        tour: { select: { name: true } },
        seller: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.passenger.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          ...(q.length >= 3 ? [{ documentNumber: { contains: q, mode: "insensitive" as const } }] : []),
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tour.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        priceAdult: true,
        category: { select: { name: true } },
      },
      take: 5,
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      tourName: b.tour.name,
      tourDate: b.tourDate.toISOString().split("T")[0],
      status: b.status,
      totalPax: b.adultCount + b.childCount,
      sellerName: `${b.seller.firstName} ${b.seller.lastName}`,
    })),
    passengers: passengers.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      nationality: p.nationality,
      documentNumber: p.documentNumber,
      email: p.email,
    })),
    tours: tours.map((t) => ({
      id: t.id,
      name: t.name,
      isActive: t.isActive,
      priceAdult: t.priceAdult.toString(),
      categoryName: t.category?.name ?? null,
    })),
  });
}
