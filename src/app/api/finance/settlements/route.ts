import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { SettlementStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as SettlementStatus | null;
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const settlements = await prisma.commissionSettlement.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true, role: true } },
      commissions: {
        include: {
          booking: { select: { bookingNumber: true, tourDate: true, tour: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = settlements.map((s) => ({
    id: s.id,
    userName: `${s.user.firstName} ${s.user.lastName}`,
    userRole: s.user.role,
    userId: s.userId,
    periodStart: s.periodStart.toISOString().split("T")[0],
    periodEnd: s.periodEnd.toISOString().split("T")[0],
    totalSales: s.totalSales.toString(),
    totalCommission: s.totalCommission.toString(),
    status: s.status,
    approvedAt: s.approvedAt?.toISOString() ?? null,
    paidAt: s.paidAt?.toISOString() ?? null,
    paymentReference: s.paymentReference,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    commissionCount: s.commissions.length,
    commissions: s.commissions.map((c) => ({
      id: c.id,
      bookingNumber: c.booking.bookingNumber,
      tourName: c.booking.tour.name,
      tourDate: c.booking.tourDate.toISOString().split("T")[0],
      baseAmount: c.baseAmount.toString(),
      commissionAmount: c.commissionAmount.toString(),
    })),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, periodStart, periodEnd } = body as {
    userId: string;
    periodStart: string;
    periodEnd: string;
  };

  if (!userId || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      commissionConfigs: {
        where: {
          effectiveFrom: { lte: new Date(periodEnd) },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date(periodStart) } }],
        },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const config = user.commissionConfigs[0];
  if (!config) {
    return NextResponse.json({ error: "El usuario no tiene configuración de comisión activa" }, { status: 400 });
  }

  const paidBookings = await prisma.booking.findMany({
    where: {
      sellerId: userId,
      status: "PAID",
      deletedAt: null,
      tourDate: {
        gte: new Date(periodStart),
        lte: new Date(periodEnd),
      },
      commissions: { none: {} },
    },
    select: {
      id: true,
      totalAmount: true,
      bookingNumber: true,
    },
  });

  if (paidBookings.length === 0) {
    return NextResponse.json(
      { error: "No hay reservas pagadas sin liquidar en este período" },
      { status: 400 }
    );
  }

  let totalSales = 0;
  let totalCommission = 0;
  const commissionData: { bookingId: string; baseAmount: number; commissionAmount: number }[] = [];

  for (const booking of paidBookings) {
    const base = Number(booking.totalAmount);
    let commission = 0;

    if (config.commissionType === "PERCENTAGE_PER_SALE" && config.percentage) {
      commission = base * (Number(config.percentage) / 100);
    } else if (config.commissionType === "FIXED_PER_SALE" && config.fixedAmount) {
      commission = Number(config.fixedAmount);
    }

    totalSales += base;
    totalCommission += commission;
    commissionData.push({ bookingId: booking.id, baseAmount: base, commissionAmount: commission });
  }

  if (config.commissionType === "GOAL_BASED" && config.goalTarget && config.goalBonus) {
    if (totalSales >= Number(config.goalTarget)) {
      totalCommission = Number(config.goalBonus);
    }
    for (const cd of commissionData) {
      cd.commissionAmount = 0;
    }
  }

  const settlement = await prisma.commissionSettlement.create({
    data: {
      userId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      totalSales,
      totalCommission,
      status: "PENDING",
      commissions: {
        create: commissionData.map((cd) => ({
          bookingId: cd.bookingId,
          userId,
          commissionConfigId: config.id,
          baseAmount: cd.baseAmount,
          commissionAmount: cd.commissionAmount,
        })),
      },
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      commissions: true,
    },
  });

  return NextResponse.json({
    id: settlement.id,
    totalSales: settlement.totalSales.toString(),
    totalCommission: settlement.totalCommission.toString(),
    commissionCount: settlement.commissions.length,
  });
}
