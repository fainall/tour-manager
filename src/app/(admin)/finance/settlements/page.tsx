import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettlementsClient } from "./settlements-client";

export default async function SettlementsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) redirect("/");

  const [sellers, settlements] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["SELLER", "SALES_SUPERVISOR"] },
        isActive: true,
        deletedAt: null,
        commissionConfigs: { some: { effectiveTo: null } },
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.commissionSettlement.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
        commissions: {
          include: {
            booking: {
              select: { bookingNumber: true, tourDate: true, tour: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

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

  return (
    <SettlementsClient
      initialSettlements={serialized}
      sellers={sellers}
      userRole={session.user.role}
    />
  );
}
