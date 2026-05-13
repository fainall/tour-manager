import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!tour) {
    return NextResponse.json({ error: "Tour no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...tour,
    priceAdult: tour.priceAdult.toString(),
    priceChild: tour.priceChild.toString(),
    minPriceAdult: tour.minPriceAdult?.toString() ?? null,
    minPriceChild: tour.minPriceChild?.toString() ?? null,
    directCost: tour.directCost.toString(),
    meetingPointLat: tour.meetingPointLat?.toString() ?? null,
    meetingPointLng: tour.meetingPointLng?.toString() ?? null,
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || !["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    name, description, categoryId, durationMinutes, meetingPoint,
    priceAdult, priceChild, minPriceAdult, minPriceChild, directCost,
    maxPax, minPax, includedItems, excludedItems, notes, isActive, schedules,
  } = body;

  const existing = await prisma.tour.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "Tour no encontrado" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description || null;
  if (categoryId !== undefined) updateData.categoryId = categoryId || null;
  if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes);
  if (meetingPoint !== undefined) updateData.meetingPoint = meetingPoint || null;
  if (priceAdult !== undefined) updateData.priceAdult = parseFloat(priceAdult);
  if (priceChild !== undefined) updateData.priceChild = parseFloat(priceChild);
  if (minPriceAdult !== undefined) updateData.minPriceAdult = minPriceAdult ? parseFloat(minPriceAdult) : null;
  if (minPriceChild !== undefined) updateData.minPriceChild = minPriceChild ? parseFloat(minPriceChild) : null;
  if (directCost !== undefined) updateData.directCost = parseFloat(directCost);
  if (maxPax !== undefined) updateData.maxPax = maxPax ? parseInt(maxPax) : null;
  if (minPax !== undefined) updateData.minPax = parseInt(minPax);
  if (includedItems !== undefined) updateData.includedItems = includedItems;
  if (excludedItems !== undefined) updateData.excludedItems = excludedItems;
  if (notes !== undefined) updateData.notes = notes || null;
  if (isActive !== undefined) updateData.isActive = isActive;

  await prisma.tour.update({ where: { id }, data: updateData });

  if (schedules !== undefined) {
    await prisma.tourSchedule.deleteMany({ where: { tourId: id } });
    if (schedules.length > 0) {
      await prisma.tourSchedule.createMany({
        data: schedules.map((s: { dayOfWeek: string; departureTime: string }) => ({
          tourId: id,
          dayOfWeek: s.dayOfWeek,
          departureTime: s.departureTime,
        })),
      });
    }
  }

  const updated = await prisma.tour.findUnique({
    where: { id },
    include: { category: true, schedules: { where: { isActive: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.tour.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return NextResponse.json({ success: true });
}
