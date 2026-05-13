import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      commissionConfigs: {
        orderBy: { effectiveFrom: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { email, password, firstName, lastName, phone, documentId, role, isActive, commission } = body;

  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json({ error: "Ya existe un usuario con este email" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (email) updateData.email = email;
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (role) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone || null;
  if (documentId !== undefined) updateData.documentId = documentId || null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  if (commission?.commissionType) {
    await prisma.commissionConfig.updateMany({
      where: { userId: id, effectiveTo: null },
      data: { effectiveTo: new Date() },
    });

    await prisma.commissionConfig.create({
      data: {
        userId: id,
        commissionType: commission.commissionType,
        percentage: commission.percentage || null,
        fixedAmount: commission.fixedAmount || null,
        goalTarget: commission.goalTarget || null,
        goalBonus: commission.goalBonus || null,
        effectiveFrom: new Date(),
      },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    include: { commissionConfigs: { where: { effectiveTo: null }, take: 1 } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return NextResponse.json({ success: true });
}
