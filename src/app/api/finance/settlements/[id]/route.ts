import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || !["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, paymentReference, notes } = body as {
    action: "approve" | "pay" | "dispute";
    paymentReference?: string;
    notes?: string;
  };

  const settlement = await prisma.commissionSettlement.findUnique({ where: { id } });
  if (!settlement) {
    return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (action === "approve" && settlement.status === "PENDING") {
    updateData.status = "APPROVED";
    updateData.approvedBy = session.user.id;
    updateData.approvedAt = new Date();
  } else if (action === "pay" && settlement.status === "APPROVED") {
    updateData.status = "PAID";
    updateData.paidAt = new Date();
    if (paymentReference) updateData.paymentReference = paymentReference;
  } else if (action === "dispute") {
    updateData.status = "DISPUTED";
  } else {
    return NextResponse.json({ error: "Acción no válida para el estado actual" }, { status: 400 });
  }

  if (notes !== undefined) updateData.notes = notes;

  await prisma.commissionSettlement.update({ where: { id }, data: updateData });

  return NextResponse.json({ success: true });
}
