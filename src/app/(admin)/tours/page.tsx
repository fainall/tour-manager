import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function ToursPage() {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Catálogo de Tours</h1>
          <p className="mt-1 text-sm text-warm-500">
            {tours.length} tours en el catálogo
          </p>
        </div>
        <Link href="/tours/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo Tour
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            placeholder="Buscar tours..."
            className="h-11 w-full rounded-lg border border-warm-300 bg-white pl-10 pr-4 text-sm placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Tour Grid */}
      {tours.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-warm-500">No hay tours registrados</p>
            <Link href="/tours/new" className="mt-2 text-sm font-medium text-primary-500">
              Crear el primer tour
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tours.map((tour) => (
            <Link key={tour.id} href={`/tours/${tour.id}`}>
              <Card className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
                {/* Image Placeholder */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-warm-200 to-warm-300">
                  <div className="absolute inset-0 flex items-center justify-center text-warm-400">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  {!tour.isActive && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="neutral">Inactivo</Badge>
                    </div>
                  )}
                </div>
                {/* Content */}
                <CardContent className="space-y-2">
                  {tour.category && (
                    <p className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                      {tour.category.name}
                    </p>
                  )}
                  <h3 className="text-base font-semibold text-warm-900 group-hover:text-primary-600 transition-colors">
                    {tour.name}
                  </h3>
                  <p className="text-sm text-warm-500 line-clamp-2">
                    {tour.description}
                  </p>
                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-xs text-warm-500">Desde</span>
                    <span className="text-lg font-bold text-warm-900">
                      {formatCurrency(Number(tour.priceAdult))}
                    </span>
                    <span className="text-xs text-warm-500">/ persona</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
