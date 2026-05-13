import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = tours.map((t) => ({
    ...t,
    priceAdult: t.priceAdult.toString(),
    priceChild: t.priceChild.toString(),
    minPriceAdult: t.minPriceAdult?.toString() ?? null,
    minPriceChild: t.minPriceChild?.toString() ?? null,
    directCost: t.directCost.toString(),
    meetingPointLat: t.meetingPointLat?.toString() ?? null,
    meetingPointLng: t.meetingPointLng?.toString() ?? null,
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name, description, categoryId, durationMinutes, meetingPoint,
    priceAdult, priceChild, minPriceAdult, minPriceChild, directCost,
    maxPax, minPax, includedItems, excludedItems, notes, schedules,
  } = body;

  if (!name || !durationMinutes || priceAdult == null) {
    return NextResponse.json(
      { error: "Campos obligatorios: nombre, duración, precio adulto" },
      { status: 400 }
    );
  }

  const tour = await prisma.tour.create({
    data: {
      name,
      description: description || null,
      categoryId: categoryId || null,
      durationMinutes: parseInt(durationMinutes),
      meetingPoint: meetingPoint || null,
      priceAdult: parseFloat(priceAdult),
      priceChild: priceChild ? parseFloat(priceChild) : 0,
      minPriceAdult: minPriceAdult ? parseFloat(minPriceAdult) : null,
      minPriceChild: minPriceChild ? parseFloat(minPriceChild) : null,
      directCost: directCost ? parseFloat(directCost) : 0,
      maxPax: maxPax ? parseInt(maxPax) : null,
      minPax: minPax ? parseInt(minPax) : 1,
      includedItems: includedItems || [],
      excludedItems: excludedItems || [],
      notes: notes || null,
      schedules: schedules?.length
        ? {
            create: schedules.map((s: { dayOfWeek: string; departureTime: string }) => ({
              dayOfWeek: s.dayOfWeek,
              departureTime: s.departureTime,
            })),
          }
        : undefined,
    },
    include: { category: true, schedules: true },
  });

  return NextResponse.json(tour, { status: 201 });
}
