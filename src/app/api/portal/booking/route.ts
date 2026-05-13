import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get("number");
  const lastName = searchParams.get("lastName");

  if (!number || !lastName) {
    return NextResponse.json({ error: "Número de reserva y apellido requeridos" }, { status: 400 });
  }

  const bookingNumber = parseInt(number);
  if (isNaN(bookingNumber)) {
    return NextResponse.json({ error: "Número de reserva inválido" }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      bookingNumber,
      deletedAt: null,
      passengers: {
        some: {
          passenger: {
            lastName: { equals: lastName, mode: "insensitive" },
          },
        },
      },
    },
    select: { id: true },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "No encontramos una reserva con esos datos. Verifica el número y apellido." },
      { status: 404 }
    );
  }

  return NextResponse.json({ id: booking.id });
}
