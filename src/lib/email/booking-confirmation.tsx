import * as React from "react";

type BookingEmailProps = {
  bookingNumber: number;
  tourName: string;
  tourDate: string;
  departureTime: string;
  meetingPoint: string | null;
  adultCount: number;
  childCount: number;
  totalAmount: string;
  passengers: { name: string; paxType: string }[];
  portalUrl: string;
  checkInUrl: string | null;
};

export function BookingConfirmationEmail(props: BookingEmailProps) {
  const {
    bookingNumber,
    tourName,
    tourDate,
    departureTime,
    meetingPoint,
    adultCount,
    childCount,
    totalAmount,
    passengers,
    portalUrl,
    checkInUrl,
  } = props;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de Reserva #${bookingNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#e63946,#c1121f);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:8px 12px;margin-bottom:12px;">
        <span style="color:white;font-size:20px;">🏔️</span>
      </div>
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">¡Reserva Confirmada!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Reserva #${bookingNumber}</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #e8e5e0;border-top:none;">

      <!-- Tour name -->
      <h2 style="margin:0 0 20px;font-size:20px;color:#1a1a19;">${tourName}</h2>

      <!-- Details grid -->
      <div style="background:#faf9f7;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;vertical-align:top;width:40%;">
              <span style="color:#8a8780;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">📅 Fecha</span><br/>
              <span style="color:#1a1a19;font-size:15px;font-weight:600;">${tourDate}</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;">
              <span style="color:#8a8780;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">🕐 Hora de salida</span><br/>
              <span style="color:#1a1a19;font-size:15px;font-weight:600;">${departureTime} hrs</span>
            </td>
          </tr>
          ${meetingPoint ? `
          <tr>
            <td colspan="2" style="padding:8px 0;vertical-align:top;">
              <span style="color:#8a8780;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">📍 Punto de encuentro</span><br/>
              <span style="color:#1a1a19;font-size:15px;font-weight:600;">${meetingPoint}</span>
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding:8px 0;vertical-align:top;">
              <span style="color:#8a8780;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">👥 Pasajeros</span><br/>
              <span style="color:#1a1a19;font-size:15px;font-weight:600;">${adultCount} adulto${adultCount !== 1 ? "s" : ""}${childCount > 0 ? ` + ${childCount} niño${childCount !== 1 ? "s" : ""}` : ""}</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;">
              <span style="color:#8a8780;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">💰 Total</span><br/>
              <span style="color:#1a1a19;font-size:15px;font-weight:600;">${totalAmount}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Passengers -->
      ${passengers.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:14px;color:#8a8780;text-transform:uppercase;letter-spacing:0.5px;">Pasajeros</h3>
        ${passengers.map((p, i) => `
        <div style="display:flex;align-items:center;padding:10px 12px;background:${i % 2 === 0 ? "#faf9f7" : "white"};border-radius:8px;margin-bottom:2px;">
          <span style="display:inline-block;width:28px;height:28px;background:#e63946;color:white;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:600;margin-right:12px;">${p.name.charAt(0)}</span>
          <span style="color:#1a1a19;font-size:14px;font-weight:500;">${p.name}</span>
          <span style="color:#8a8780;font-size:12px;margin-left:8px;">${p.paxType === "CHILD" ? "Niño" : "Adulto"}</span>
        </div>
        `).join("")}
      </div>
      ` : ""}

      <!-- CTA Buttons -->
      <div style="text-align:center;margin:28px 0 16px;">
        <a href="${portalUrl}" style="display:inline-block;background:#e63946;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;margin-bottom:12px;">
          Ver mi Reserva
        </a>
      </div>

      ${checkInUrl ? `
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${checkInUrl}" style="display:inline-block;background:white;color:#e63946;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;border:2px solid #e63946;">
          ✅ Check-in Online
        </a>
      </div>
      ` : ""}

      <!-- Footer note -->
      <div style="border-top:1px solid #e8e5e0;padding-top:20px;margin-top:20px;">
        <p style="color:#8a8780;font-size:13px;margin:0;line-height:1.5;">
          <strong>Importante:</strong> Llegue al punto de encuentro al menos 15 minutos antes de la hora de salida.
          Para cualquier consulta, responda este correo o comuníquese con su agente de viajes.
        </p>
      </div>
    </div>

    <!-- Brand footer -->
    <div style="text-align:center;padding:24px;color:#b0ada8;font-size:12px;">
      <p style="margin:0;">Tour Manager &copy; ${new Date().getFullYear()}</p>
      <p style="margin:4px 0 0;">Sistema de gestión de tours</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildBookingConfirmationEmail(props: BookingEmailProps) {
  return {
    subject: `✅ Reserva #${props.bookingNumber} confirmada — ${props.tourName}`,
    html: BookingConfirmationEmail(props),
  };
}
