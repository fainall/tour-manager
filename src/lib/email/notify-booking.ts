import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { sendEmail } from "./send";
import { buildBookingConfirmationEmail } from "./booking-confirmation";
import { randomUUID } from "crypto";

export async function notifyBookingCreated(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tour: { select: { name: true, meetingPoint: true } },
      passengers: {
        include: {
          passenger: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!booking) return;

  let checkInToken = booking.checkInToken;
  if (!checkInToken) {
    checkInToken = randomUUID();
    await prisma.booking.update({
      where: { id: bookingId },
      data: { checkInToken },
    });
  }

  const passengerEmails = booking.passengers
    .map((bp) => bp.passenger.email)
    .filter((e): e is string => !!e);

  if (passengerEmails.length === 0) {
    console.log("[Notify] No passenger emails found for booking", bookingId);
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const tourDateObj = new Date(booking.tourDate);
  const tourDateFormatted = tourDateObj.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const { subject, html } = buildBookingConfirmationEmail({
    bookingNumber: booking.bookingNumber,
    tourName: booking.tour.name,
    tourDate: tourDateFormatted,
    departureTime: booking.departureTime,
    meetingPoint: booking.pickupPoint ?? booking.tour.meetingPoint,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    totalAmount: formatCurrency(Number(booking.totalAmount)),
    passengers: booking.passengers.map((bp) => ({
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      paxType: bp.paxType,
    })),
    portalUrl: `${baseUrl}/portal/bookings/${booking.id}`,
    checkInUrl: `${baseUrl}/portal/check-in/${checkInToken}`,
  });

  const uniqueEmails = [...new Set(passengerEmails)];

  const result = await sendEmail({
    to: uniqueEmails,
    subject,
    html,
  });

  console.log(
    "[Notify] Booking #%d email sent to %s: %s",
    booking.bookingNumber,
    uniqueEmails.join(", "),
    result.success ? "OK" : "FAILED"
  );

  return result;
}
