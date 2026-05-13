import { Plus, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Vehículos</h1>
          <p className="mt-1 text-sm text-warm-500">
            {vehicles.length} vehículos registrados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="transition-all hover:shadow-card-hover">
            <CardContent className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-50">
                <Bus className="h-6 w-6 text-secondary-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warm-900">
                  {vehicle.name || vehicle.plateNumber}
                </h3>
                <p className="text-sm text-warm-500">Patente: {vehicle.plateNumber}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="info">{vehicle.capacity} PAX</Badge>
                  <Badge variant={vehicle.isActive ? "success" : "neutral"} dot>
                    {vehicle.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
