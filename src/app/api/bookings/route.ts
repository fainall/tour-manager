import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyBookingCreated } from "@/lib/email/notify-booking";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const tourId = searchParams.get("tourId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = { deletedAt: null };
  if (status) where.status = status;
  if (tourId) where.tourId = tourId;
  if (dateFrom || dateTo) {
    where.tourDate = {};
    if (dateFrom) (where.tourDate as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.tourDate as Record<string, unknown>).lte = new Date(dateTo);
  }

  if (session.user.role === "SELLER") {
    where.sellerId = session.user.id;
  } else if (session.user.role === "GUIDE") {
    where.guideId = session.user.id;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      tour: { select: { name: true, categoryId: true } },
      seller: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
      passengers: {
        include: { passenger: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = bookings.map((b) => ({
    ...b,
    unitPriceAdult: b.unitPriceAdult.toString(),
    unitPriceChild: b.unitPriceChild.toString(),
    totalAmount: b.totalAmount.toString(),
    passengers: b.passengers.map((bp) => ({
      ...bp,
      unitPrice: bp.unitPrice.toString(),
    })),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    tourId, tourDate, departureTime, pickupPoint,
    adultCount, childCount, unitPriceAdult, unitPriceChild,
    guideId, driverId, vehicleId, internalNotes, clientNotes,
    passengers,
  } = body;

  if (!tourId || !tourDate || !departureTime) {
    return NextResponse.json(
      { error: "Campos obligatorios: tour, fecha, hora de salida" },
      { status: 400 }
    );
  }

  const totalAmount =
    (adultCount || 0) * parseFloat(unitPriceAdult || 0) +
    (childCount || 0) * parseFloat(unitPriceChild || 0);

  const booking = await prisma.booking.create({
    data: {
      tourId,
      tourDate: new Date(tourDate),
      departureTime,
      pickupPoint: pickupPoint || null,
      adultCount: parseInt(adultCount) || 0,
      childCount: parseInt(childCount) || 0,
      unitPriceAdult: parseFloat(unitPriceAdult) || 0,
      unitPriceChild: parseFloat(unitPriceChild) || 0,
      totalAmount,
      sellerId: session.user.id,
      guideId: guideId || null,
      driverId: driverId || null,
      vehicleId: vehicleId || null,
      internalNotes: internalNotes || null,
      clientNotes: clientNotes || null,
      status: "RESERVED",
      passengers: passengers?.length
        ? {
            create: await Promise.all(
              passengers.map(async (p: {
                firstName: string;
                lastName: string;
                nationality?: string;
                documentType?: string;
                documentNumber?: string;
                email?: string;
                phone?: string;
                paxType: string;
                unitPrice: number;
              }) => {
                const passenger = await prisma.passenger.create({
                  data: {
                    firstName: p.firstName,
                    lastName: p.lastName,
                    nationality: p.nationality || null,
                    documentType: p.documentType || null,
                    documentNumber: p.documentNumber || null,
                    email: p.email || null,
                    phone: p.phone || null,
                  },
                });
                return {
                  passengerId: passenger.id,
                  paxType: p.paxType as "ADULT" | "CHILD",
                  unitPrice: p.unitPrice,
                };
              })
            ),
          }
        : undefined,
    },
    include: {
      tour: true,
      seller: true,
      passengers: { include: { passenger: true } },
    },
  });

  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      fromStatus: null,
      toStatus: "RESERVED",
      changedBy: session.user.id,
    },
  });

  // Send confirmation email asynchronously (non-blocking)
  notifyBookingCreated(booking.id).catch((err) =>
    console.error("[Booking] Email notification failed:", err)
  );

  return NextResponse.json(booking, { status: 201 });
}
