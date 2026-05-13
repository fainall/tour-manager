import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      commissionConfigs: {
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, firstName, lastName, phone, documentId, role, commission } = body;

  if (!email || !password || !firstName || !lastName || !role) {
    return NextResponse.json(
      { error: "Campos obligatorios: email, contraseña, nombre, apellido, rol" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un usuario con este email" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      documentId: documentId || null,
      role,
      commissionConfigs: commission?.commissionType
        ? {
            create: {
              commissionType: commission.commissionType,
              percentage: commission.percentage || null,
              fixedAmount: commission.fixedAmount || null,
              goalTarget: commission.goalTarget || null,
              goalBonus: commission.goalBonus || null,
              effectiveFrom: new Date(),
            },
          }
        : undefined,
    },
    include: {
      commissionConfigs: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
