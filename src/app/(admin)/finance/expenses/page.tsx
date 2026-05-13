import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [expenses, tours, staff] = await Promise.all([
    prisma.tourExpense.findMany({
      where: {
        tourDeparture: {
          departureDate: { gte: firstOfMonth, lte: lastOfMonth },
        },
      },
      include: {
        tourDeparture: {
          select: {
            departureDate: true,
            departureTime: true,
            tour: { select: { name: true } },
          },
        },
        paidTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tour.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["GUIDE", "DRIVER"] },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const serialized = expenses.map((e) => ({
    id: e.id,
    tourName: e.tourDeparture.tour.name,
    departureDate: e.tourDeparture.departureDate.toISOString().split("T")[0],
    departureTime: e.tourDeparture.departureTime,
    category: e.category,
    description: e.description,
    amount: e.amount.toString(),
    paidToName: e.paidTo ? `${e.paidTo.firstName} ${e.paidTo.lastName}` : null,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <ExpensesClient
      initialExpenses={serialized}
      tours={tours}
      staff={staff}
      userRole={session.user.role}
    />
  );
}
