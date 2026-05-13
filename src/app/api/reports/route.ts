import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const dateFrom = from ? parseLocalDate(from) : defaultFrom;
  const dateTo = to ? parseLocalDate(to, true) : defaultTo;

  const baseWhere = {
    tourDate: { gte: dateFrom, lte: dateTo },
    status: { not: "CANCELLED" as const },
    deletedAt: null,
  };

  const [
    bookings,
    totalBookingsCount,
    cancelledCount,
    payments,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: baseWhere,
      include: {
        tour: { select: { id: true, name: true, categoryId: true, priceAdult: true, directCost: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        guide: { select: { id: true, firstName: true, lastName: true } },
        passengers: { select: { checkedIn: true, paxType: true } },
      },
      orderBy: { tourDate: "asc" },
    }),
    prisma.booking.count({
      where: { tourDate: { gte: dateFrom, lte: dateTo }, deletedAt: null },
    }),
    prisma.booking.count({
      where: { tourDate: { gte: dateFrom, lte: dateTo }, status: "CANCELLED", deletedAt: null },
    }),
    prisma.payment.findMany({
      where: {
        booking: baseWhere,
        status: "COMPLETED",
        deletedAt: null,
      },
      select: { amount: true, paymentMethod: true, paymentDate: true },
    }),
  ]);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const totalPax = bookings.reduce((sum, b) => sum + b.adultCount + b.childCount, 0);
  const totalAdults = bookings.reduce((sum, b) => sum + b.adultCount, 0);
  const totalChildren = bookings.reduce((sum, b) => sum + b.childCount, 0);
  const totalCheckedIn = bookings.reduce(
    (sum, b) => sum + b.passengers.filter((p) => p.checkedIn).length,
    0
  );
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const avgTicket = bookings.length > 0 ? totalRevenue / bookings.length : 0;
  const avgPaxPerBooking = bookings.length > 0 ? totalPax / bookings.length : 0;
  const checkInRate = totalPax > 0 ? Math.round((totalCheckedIn / totalPax) * 100) : 0;
  const cancellationRate = totalBookingsCount > 0
    ? Math.round((cancelledCount / totalBookingsCount) * 100)
    : 0;

  // Revenue by day
  const revenueByDay: Record<string, { date: string; revenue: number; bookings: number; pax: number }> = {};
  for (const b of bookings) {
    const day = new Date(b.tourDate).toISOString().split("T")[0];
    if (!revenueByDay[day]) {
      revenueByDay[day] = { date: day, revenue: 0, bookings: 0, pax: 0 };
    }
    revenueByDay[day].revenue += Number(b.totalAmount);
    revenueByDay[day].bookings += 1;
    revenueByDay[day].pax += b.adultCount + b.childCount;
  }

  // Top tours
  const tourMap: Record<string, { id: string; name: string; bookings: number; revenue: number; pax: number; cost: number }> = {};
  for (const b of bookings) {
    const tid = b.tour.id;
    if (!tourMap[tid]) {
      tourMap[tid] = {
        id: tid,
        name: b.tour.name,
        bookings: 0,
        revenue: 0,
        pax: 0,
        cost: Number(b.tour.directCost) * (b.adultCount + b.childCount),
      };
    }
    tourMap[tid].bookings += 1;
    tourMap[tid].revenue += Number(b.totalAmount);
    tourMap[tid].pax += b.adultCount + b.childCount;
  }
  const topTours = Object.values(tourMap).sort((a, b) => b.revenue - a.revenue);

  // Seller performance
  const sellerMap: Record<string, { id: string; name: string; bookings: number; revenue: number; pax: number }> = {};
  for (const b of bookings) {
    const sid = b.seller.id;
    if (!sellerMap[sid]) {
      sellerMap[sid] = {
        id: sid,
        name: `${b.seller.firstName} ${b.seller.lastName}`,
        bookings: 0,
        revenue: 0,
        pax: 0,
      };
    }
    sellerMap[sid].bookings += 1;
    sellerMap[sid].revenue += Number(b.totalAmount);
    sellerMap[sid].pax += b.adultCount + b.childCount;
  }
  const sellerRanking = Object.values(sellerMap).sort((a, b) => b.revenue - a.revenue);

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const b of bookings) {
    statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
  }
  statusBreakdown["CANCELLED"] = cancelledCount;

  // Payment methods
  const paymentMethodBreakdown: Record<string, number> = {};
  for (const p of payments) {
    paymentMethodBreakdown[p.paymentMethod] = (paymentMethodBreakdown[p.paymentMethod] || 0) + Number(p.amount);
  }

  return NextResponse.json({
    period: {
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
    },
    summary: {
      totalBookings: bookings.length,
      totalBookingsIncCancelled: totalBookingsCount,
      cancelledCount,
      cancellationRate,
      totalRevenue,
      totalCollected,
      pendingCollection: totalRevenue - totalCollected,
      avgTicket: Math.round(avgTicket),
      avgPaxPerBooking: Math.round(avgPaxPerBooking * 10) / 10,
      totalPax,
      totalAdults,
      totalChildren,
      checkInRate,
    },
    revenueByDay: Object.values(revenueByDay),
    topTours,
    sellerRanking,
    statusBreakdown,
    paymentMethodBreakdown,
  });
}

function parseLocalDate(dateStr: string, endOfDay = false): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (endOfDay) {
    return new Date(y, m - 1, d, 23, 59, 59);
  }
  return new Date(y, m - 1, d);
}
