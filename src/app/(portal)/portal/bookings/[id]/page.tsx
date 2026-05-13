import { notFound } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getLocale } from "../../_i18n/get-locale";
import { getDictionary } from "../../_i18n";
import { BookingDetail } from "./booking-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function PortalBookingPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
    include: {
      tour: {
        select: {
          name: true,
          description: true,
          durationMinutes: true,
          meetingPoint: true,
          includedItems: true,
          excludedItems: true,
        },
      },
      guide: { select: { firstName: true } },
      vehicle: { select: { name: true } },
      passengers: {
        include: {
          passenger: {
            select: { firstName: true, lastName: true, nationality: true },
          },
        },
      },
    },
  });

  if (!booking) return notFound();

  let checkInToken = booking.checkInToken;
  if (!checkInToken) {
    checkInToken = randomUUID();
    await prisma.booking.update({
      where: { id },
      data: { checkInToken },
    });
  }

  const data = {
    bookingNumber: booking.bookingNumber,
    tourName: booking.tour.name,
    tourDescription: booking.tour.description,
    tourDuration: booking.tour.durationMinutes,
    meetingPoint: booking.tour.meetingPoint,
    includedItems: (booking.tour.includedItems as string[]) ?? [],
    excludedItems: (booking.tour.excludedItems as string[]) ?? [],
    tourDate: `${booking.tourDate.getFullYear()}-${String(booking.tourDate.getMonth() + 1).padStart(2, "0")}-${String(booking.tourDate.getDate()).padStart(2, "0")}`,
    departureTime: booking.departureTime,
    pickupPoint: booking.pickupPoint,
    status: booking.status,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    totalPax: booking.adultCount + booking.childCount,
    guideName: booking.guide?.firstName ?? null,
    vehicleName: booking.vehicle?.name ?? null,
    clientNotes: booking.clientNotes,
    checkInToken,
    passengers: booking.passengers.map((bp) => ({
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      nationality: bp.passenger.nationality ?? "",
      paxType: bp.paxType,
    })),
  };

  return <BookingDetail booking={data} dict={dict} locale={locale} />;
}
