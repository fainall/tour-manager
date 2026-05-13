import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ExpenseCategory } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category") as ExpenseCategory | null;

  const where: Record<string, unknown> = {};

  if (from && to) {
    where.tourDeparture = {
      departureDate: {
        gte: new Date(from),
        lte: new Date(to),
      },
    };
  }

  if (category) where.category = category;

  const expenses = await prisma.tourExpense.findMany({
    where,
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
    take: 100,
  });

  const serialized = expenses.map((e) => ({
    id: e.id,
    tourName: e.tourDeparture.tour.name,
    departureDate: e.tourDeparture.departureDate.toISOString().split("T")[0],
    departureTime: e.tourDeparture.departureTime,
    category: e.category,
    description: e.description,
    amount: e.amount.toString(),
    paidToName: e.paidTo ? `${e.paidTo.firstName} ${e.paidTo.lastName}` : null,
    receiptUrl: e.receiptUrl,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { tourId, departureDate, departureTime, category, description, amount, paidToId } = body as {
    tourId: string;
    departureDate: string;
    departureTime: string;
    category: ExpenseCategory;
    description?: string;
    amount: number;
    paidToId?: string;
  };

  if (!tourId || !departureDate || !departureTime || !category || !amount) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  let departure = await prisma.tourDeparture.findUnique({
    where: {
      tourId_departureDate_departureTime: {
        tourId,
        departureDate: new Date(departureDate),
        departureTime,
      },
    },
  });

  if (!departure) {
    departure = await prisma.tourDeparture.create({
      data: {
        tourId,
        departureDate: new Date(departureDate),
        departureTime,
      },
    });
  }

  const expense = await prisma.tourExpense.create({
    data: {
      tourDepartureId: departure.id,
      category,
      description: description || null,
      amount,
      paidToId: paidToId || null,
    },
  });

  return NextResponse.json({ id: expense.id, amount: expense.amount.toString() });
}
