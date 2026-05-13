import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { BookingStatus } from "@/generated/prisma/client";

const VALID_TRANSITIONS: Record<string, string[]> = {
  RESERVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: ["PAID"],
  PAID: [],
  CANCELLED: [],
  NO_SHOW: [],
};

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
    include: {
      tour: true,
      seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      guide: { select: { id: true, firstName: true, lastName: true } },
      driver: { select: { id: true, firstName: true, lastName: true } },
      vehicle: true,
      passengers: {
        include: { passenger: true },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ...booking,
    unitPriceAdult: booking.unitPriceAdult.toString(),
    unitPriceChild: booking.unitPriceChild.toString(),
    totalAmount: booking.totalAmount.toString(),
    tour: {
      ...booking.tour,
      priceAdult: booking.tour.priceAdult.toString(),
      priceChild: booking.tour.priceChild.toString(),
      minPriceAdult: booking.tour.minPriceAdult?.toString() ?? null,
      minPriceChild: booking.tour.minPriceChild?.toString() ?? null,
      directCost: booking.tour.directCost.toString(),
    },
    passengers: booking.passengers.map((bp) => ({
      ...bp,
      unitPrice: bp.unitPrice.toString(),
    })),
    payments: booking.payments.map((p) => ({
      ...p,
      amount: p.amount.toString(),
    })),
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (body.status && body.status !== booking.status) {
    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${booking.status} a ${body.status}` },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: body.status as BookingStatus,
        ...(body.status === "CANCELLED"
          ? {
              cancellationReason: body.cancellationReason || null,
              cancelledAt: new Date(),
              cancelledBy: session.user.id,
            }
          : {}),
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: body.status,
        changedBy: session.user.id,
        reason: body.reason || null,
      },
    });
  }

  const updateData: Record<string, unknown> = {};
  if (body.guideId !== undefined) updateData.guideId = body.guideId || null;
  if (body.driverId !== undefined) updateData.driverId = body.driverId || null;
  if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId || null;
  if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes || null;
  if (body.pickupPoint !== undefined) updateData.pickupPoint = body.pickupPoint || null;

  if (Object.keys(updateData).length > 0) {
    await prisma.booking.update({ where: { id }, data: updateData });
  }

  return NextResponse.json({ success: true });
}
