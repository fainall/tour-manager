import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLocale } from "../../_i18n/get-locale";
import { getDictionary } from "../../_i18n";
import { CheckInForm } from "./check-in-form";

type PageProps = { params: Promise<{ token: string }> };

export default async function CheckInPage({ params }: PageProps) {
  const { token } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const booking = await prisma.booking.findUnique({
    where: { checkInToken: token },
    include: {
      tour: { select: { name: true } },
      passengers: {
        include: {
          passenger: {
            select: { firstName: true, lastName: true, nationality: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!booking || booking.deletedAt) return notFound();

  const data = {
    tourName: booking.tour.name,
    bookingNumber: booking.bookingNumber,
    tourDate: `${booking.tourDate.getFullYear()}-${String(booking.tourDate.getMonth() + 1).padStart(2, "0")}-${String(booking.tourDate.getDate()).padStart(2, "0")}`,
    departureTime: booking.departureTime,
    token,
    passengers: booking.passengers.map((bp) => ({
      id: bp.id,
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      nationality: bp.passenger.nationality,
      paxType: bp.paxType,
      checkedIn: bp.checkedIn,
    })),
  };

  return <CheckInForm data={data} dict={dict} locale={locale} />;
}
