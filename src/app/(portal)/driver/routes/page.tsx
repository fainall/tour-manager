"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Shield,
  Navigation,
  Loader2,
  RefreshCw,
} from "lucide-react";

type RouteData = {
  id: string;
  bookingNumber: number;
  tourName: string;
  departureTime: string;
  duration: number;
  status: string;
  role: "DRIVER" | "GUIDE" | "DRIVER_GUIDE";
  meetingPoint: string | null;
  totalPax: number;
  checkedInCount: number;
  vehicle: { name: string; plate: string; capacity: number } | null;
};

const ROLE_LABELS: Record<string, string> = {
  DRIVER: "Conductor",
  GUIDE: "Guía",
  DRIVER_GUIDE: "Conductor & Guía",
};

const ROLE_COLORS: Record<string, string> = {
  DRIVER: "bg-blue-100 text-blue-700",
  GUIDE: "bg-amber-100 text-amber-700",
  DRIVER_GUIDE: "bg-purple-100 text-purple-700",
};

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getDateParam() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DriverRoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function fetchRoutes(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/driver/routes?date=${getDateParam()}`);
      if (res.status === 401) {
        router.push("/driver");
        return;
      }
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-warm-500 text-sm">
            <Calendar className="h-4 w-4" />
            Hoy
          </div>
          <h1 className="text-xl font-bold text-warm-900 capitalize">{formatToday()}</h1>
        </div>
        <button
          onClick={() => fetchRoutes(true)}
          disabled={refreshing}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-warm-200 text-warm-500 hover:bg-warm-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white border border-warm-200 p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">{routes.length}</p>
          <p className="text-xs text-warm-500">Rutas</p>
        </div>
        <div className="rounded-xl bg-white border border-warm-200 p-3 text-center">
          <p className="text-2xl font-bold text-warm-900">
            {routes.reduce((s, r) => s + r.totalPax, 0)}
          </p>
          <p className="text-xs text-warm-500">Pasajeros</p>
        </div>
        <div className="rounded-xl bg-white border border-warm-200 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {routes.reduce((s, r) => s + r.checkedInCount, 0)}
          </p>
          <p className="text-xs text-warm-500">Check-ins</p>
        </div>
      </div>

      {/* Route list */}
      {routes.length === 0 ? (
        <div className="rounded-2xl bg-white border border-warm-200 p-8 text-center">
          <Navigation className="mx-auto h-12 w-12 text-warm-300" />
          <p className="mt-3 font-semibold text-warm-700">Sin rutas para hoy</p>
          <p className="mt-1 text-sm text-warm-500">No tienes tours asignados para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => {
            const paxProgress = route.totalPax > 0
              ? Math.round((route.checkedInCount / route.totalPax) * 100)
              : 0;

            return (
              <button
                key={route.id}
                onClick={() => router.push(`/driver/routes/${route.id}`)}
                className="block w-full rounded-2xl bg-white border border-warm-200 p-4 text-left hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[route.role]}`}>
                        {route.role === "DRIVER" || route.role === "DRIVER_GUIDE" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <Navigation className="h-3 w-3" />
                        )}
                        {ROLE_LABELS[route.role]}
                      </span>
                      <span className="text-xs text-warm-400">#{route.bookingNumber}</span>
                    </div>
                    <h3 className="mt-1.5 font-semibold text-warm-900 truncate">
                      {route.tourName}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-warm-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {route.departureTime} · {route.duration}min
                      </span>
                      {route.meetingPoint && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {route.meetingPoint}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-warm-400 shrink-0 mt-3" />
                </div>

                {/* Pax progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-warm-500">
                    <Users className="h-3.5 w-3.5" />
                    {route.checkedInCount}/{route.totalPax}
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-warm-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${paxProgress}%` }}
                    />
                  </div>
                  {route.checkedInCount === route.totalPax && route.totalPax > 0 && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>

                {route.vehicle && (
                  <div className="mt-2 text-xs text-warm-400">
                    🚐 {route.vehicle.name} · {route.vehicle.plate} · {route.vehicle.capacity} asientos
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
