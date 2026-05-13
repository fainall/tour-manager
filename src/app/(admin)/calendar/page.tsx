import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED"] },
      tourDate: { gte: firstDay, lte: lastDay },
    },
    include: {
      tour: { select: { name: true } },
      seller: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ tourDate: "asc" }, { departureTime: "asc" }],
  });

  const initial = bookings.map((b) => ({
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

  return <CalendarView initialBookings={initial} initialMonth={now.toISOString()} />;
}
