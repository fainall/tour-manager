import { Search, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function PassengersPage() {
  const passengers = await prisma.passenger.findMany({
    where: { deletedAt: null },
    include: {
      bookingPassengers: {
        include: { booking: { select: { bookingNumber: true, tourDate: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Pasajeros</h1>
        <p className="mt-1 text-sm text-warm-500">
          {passengers.length} pasajeros registrados
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUT o pasaporte..."
          className="h-11 w-full rounded-lg border border-warm-300 bg-white pl-10 pr-4 text-sm placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {passengers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-3 h-10 w-10 text-warm-300" />
            <p className="text-warm-500">No hay pasajeros registrados</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Nacionalidad</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Reservas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {passengers.map((pax) => (
                  <tr key={pax.id} className="transition-colors hover:bg-warm-50">
                    <td className="px-6 py-4 text-sm font-medium text-warm-900">
                      {pax.firstName} {pax.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-700">
                      {pax.documentNumber || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-700">
                      {pax.nationality || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-500">
                      {pax.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-700">
                      {pax.bookingPassengers.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
