import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { VoucherPrint } from "./voucher-print";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> };

export default async function VoucherPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const { type } = await searchParams;
  const voucherType = type === "commercial" ? "COMMERCIAL" : "BOARDING";

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
        },
      },
      seller: { select: { firstName: true, lastName: true } },
      guide: { select: { firstName: true, lastName: true } },
      driver: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true, plateNumber: true } },
      passengers: {
        include: { passenger: true },
      },
      vouchers: {
        where: { isVoid: false, voucherType },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) notFound();

  const data = {
    bookingNumber: booking.bookingNumber,
    tourName: booking.tour.name,
    tourDescription: booking.tour.description,
    tourDuration: booking.tour.durationMinutes,
    meetingPoint: booking.tour.meetingPoint,
    includedItems: booking.tour.includedItems as string[],
    tourDate: booking.tourDate.toISOString().split("T")[0],
    departureTime: booking.departureTime,
    pickupPoint: booking.pickupPoint,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    totalPax: booking.adultCount + booking.childCount,
    totalAmount: booking.totalAmount.toString(),
    status: booking.status,
    sellerName: `${booking.seller.firstName} ${booking.seller.lastName}`,
    guideName: booking.guide ? `${booking.guide.firstName} ${booking.guide.lastName}` : null,
    driverName: booking.driver ? `${booking.driver.firstName} ${booking.driver.lastName}` : null,
    vehiclePlate: booking.vehicle?.plateNumber ?? null,
    vehicleName: booking.vehicle?.name ?? null,
    clientNotes: booking.clientNotes,
    passengers: booking.passengers.map((bp) => ({
      name: `${bp.passenger.firstName} ${bp.passenger.lastName}`,
      nationality: bp.passenger.nationality,
      documentNumber: bp.passenger.documentNumber,
      paxType: bp.paxType,
    })),
    vouchers: booking.vouchers.map((v) => ({
      id: v.id,
      voucherCode: v.voucherCode,
      voucherType: v.voucherType,
      seatInfo: v.seatInfo,
      issuedAt: v.issuedAt.toISOString(),
      passengerId: v.passengerId,
    })),
  };

  return <VoucherPrint data={data} type={voucherType} />;
}
