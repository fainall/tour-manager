import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email: string };

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      role: { in: ["DRIVER", "GUIDE"] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No se encontró un conductor o guía con ese email" },
      { status: 404 }
    );
  }

  const response = NextResponse.json({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  });

  response.cookies.set("driver-session", user.id, {
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
  });

  return response;
}
