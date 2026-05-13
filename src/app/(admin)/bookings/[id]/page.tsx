import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookingDetail } from "./booking-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
    include: {
      tour: true,
      seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      guide: { select: { id: true, firstName: true, lastName: true } },
      driver: { select: { id: true, firstName: true, lastName: true } },
      vehicle: true,
      passengers: {
        include: { passenger: true },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) notFound();

  const serialized = {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    tourName: booking.tour.name,
    tourDate: booking.tourDate.toISOString(),
    departureTime: booking.departureTime,
    pickupPoint: booking.pickupPoint,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    unitPriceAdult: booking.unitPriceAdult.toString(),
    unitPriceChild: booking.unitPriceChild.toString(),
    totalAmount: booking.totalAmount.toString(),
    status: booking.status,
    seller: booking.seller,
    guide: booking.guide,
    driver: booking.driver,
    vehicle: booking.vehicle ? { name: booking.vehicle.name, plateNumber: booking.vehicle.plateNumber } : null,
    internalNotes: booking.internalNotes,
    clientNotes: booking.clientNotes,
    cancellationReason: booking.cancellationReason,
    createdAt: booking.createdAt.toISOString(),
    passengers: booking.passengers.map((bp) => ({
      id: bp.id,
      paxType: bp.paxType,
      unitPrice: bp.unitPrice.toString(),
      checkedIn: bp.checkedIn,
      passenger: {
        firstName: bp.passenger.firstName,
        lastName: bp.passenger.lastName,
        nationality: bp.passenger.nationality,
        documentNumber: bp.passenger.documentNumber,
        email: bp.passenger.email,
        phone: bp.passenger.phone,
      },
    })),
    statusHistory: booking.statusHistory.map((h) => ({
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return <BookingDetail booking={serialized} userRole={session.user.role} />;
}
