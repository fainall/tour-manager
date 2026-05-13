import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TourForm } from "../tour-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTourPage({ params }: PageProps) {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!tour) notFound();

  const tourData = {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    categoryId: tour.categoryId,
    durationMinutes: tour.durationMinutes,
    meetingPoint: tour.meetingPoint,
    priceAdult: tour.priceAdult.toString(),
    priceChild: tour.priceChild.toString(),
    minPriceAdult: tour.minPriceAdult?.toString() ?? null,
    minPriceChild: tour.minPriceChild?.toString() ?? null,
    directCost: tour.directCost.toString(),
    maxPax: tour.maxPax,
    minPax: tour.minPax,
    includedItems: (tour.includedItems as string[]) ?? [],
    excludedItems: (tour.excludedItems as string[]) ?? [],
    notes: tour.notes,
    isActive: tour.isActive,
    schedules: tour.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      departureTime: s.departureTime,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/tours"
          className="rounded-lg p-2 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Editar Tour</h1>
          <p className="mt-0.5 text-sm text-warm-500">{tour.name}</p>
        </div>
      </div>
      <TourForm tour={tourData} />
    </div>
  );
}
