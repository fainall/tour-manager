import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notifyBookingCreated } from "@/lib/email/notify-booking";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await notifyBookingCreated(id);
    return NextResponse.json({
      success: result?.success ?? false,
      message: result?.success ? "Email enviado" : "No se pudo enviar",
    });
  } catch (error) {
    console.error("[Notify API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}
