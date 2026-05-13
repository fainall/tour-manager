import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

type RouteParams = { params: Promise<{ id: string }> };

function generateVoucherCode(): string {
  return `V-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { voucherType } = body as { voucherType: "BOARDING" | "COMMERCIAL" };

  if (!voucherType || !["BOARDING", "COMMERCIAL"].includes(voucherType)) {
    return NextResponse.json({ error: "Tipo de voucher inválido" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
    include: {
      tour: { select: { name: true, description: true, durationMinutes: true, meetingPoint: true, includedItems: true } },
      seller: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
      driver: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true, plateNumber: true } },
      passengers: {
        include: { passenger: true },
      },
      vouchers: {
        where: { isVoid: false, voucherType },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (!["CONFIRMED", "COMPLETED", "PAID"].includes(booking.status)) {
    return NextResponse.json(
      { error: "La reserva debe estar confirmada para generar vouchers" },
      { status: 400 }
    );
  }

  if (booking.vouchers.length > 0) {
    await prisma.voucher.updateMany({
      where: { bookingId: id, voucherType, isVoid: false },
      data: { isVoid: true, voidedAt: new Date() },
    });
  }

  const summaryData = {
    tourName: booking.tour.name,
    tourDescription: booking.tour.description,
    tourDuration: booking.tour.durationMinutes,
    meetingPoint: booking.tour.meetingPoint,
    includedItems: booking.tour.includedItems,
    tourDate: booking.tourDate.toISOString().split("T")[0],
    departureTime: booking.departureTime,
    pickupPoint: booking.pickupPoint,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    totalPax: booking.adultCount + booking.childCount,
    totalAmount: booking.totalAmount.toString(),
    sellerName: `${booking.seller.firstName} ${booking.seller.lastName}`,
    guideName: booking.guide ? `${booking.guide.firstName} ${booking.guide.lastName}` : null,
    driverName: booking.driver ? `${booking.driver.firstName} ${booking.driver.lastName}` : null,
    vehiclePlate: booking.vehicle?.plateNumber ?? null,
    vehicleName: booking.vehicle?.name ?? null,
    clientNotes: booking.clientNotes,
    bookingNumber: booking.bookingNumber,
    passengers: booking.passengers.map((bp) => ({
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      nationality: bp.passenger.nationality,
      documentNumber: bp.passenger.documentNumber,
      paxType: bp.paxType,
    })),
  };

  if (voucherType === "BOARDING") {
    const vouchers = await prisma.$transaction(
      booking.passengers.map((bp, idx) =>
        prisma.voucher.create({
          data: {
            voucherType: "BOARDING",
            voucherCode: generateVoucherCode(),
            bookingId: id,
            passengerId: bp.passengerId,
            seatInfo: `${idx + 1}`,
            summaryData: {
              ...summaryData,
              passengerName: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
              passengerNationality: bp.passenger.nationality,
              passengerDocument: bp.passenger.documentNumber,
              paxType: bp.paxType,
              seatNumber: idx + 1,
            },
          },
        })
      )
    );
    return NextResponse.json(vouchers);
  }

  const voucher = await prisma.voucher.create({
    data: {
      voucherType: "COMMERCIAL",
      voucherCode: generateVoucherCode(),
      bookingId: id,
      summaryData,
    },
  });

  return NextResponse.json([voucher]);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const vouchers = await prisma.voucher.findMany({
    where: { bookingId: id, isVoid: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vouchers);
}
