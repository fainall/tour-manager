"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Phone,
  Navigation,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Baby,
  Globe,
  Loader2,
  Map,
  MessageSquare,
  Shield,
  StickyNote,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PassengerDetail = {
  id: string;
  name: string;
  nationality: string;
  phone: string | null;
  paxType: string;
  seatNumber: number | null;
  checkedIn: boolean;
  specialNeeds: string | null;
  notes: string | null;
};

type RouteDetail = {
  id: string;
  bookingNumber: number;
  tourName: string;
  departureTime: string;
  duration: number;
  status: string;
  role: string;
  meetingPoint: string | null;
  meetingPointLat: string | null;
  meetingPointLng: string | null;
  totalPax: number;
  checkedInCount: number;
  vehicle: { name: string; plate: string; capacity: number } | null;
  guide: { name: string; phone: string | null } | null;
  driver: { name: string; phone: string | null } | null;
  clientNotes: string | null;
  passengers: PassengerDetail[];
};

const ROLE_LABELS: Record<string, string> = {
  DRIVER: "Conductor",
  GUIDE: "Guía",
  DRIVER_GUIDE: "Conductor & Guía",
};

function getGoogleMapsUrl(lat: string | null, lng: string | null, address: string | null) {
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return null;
}

function getWazeUrl(lat: string | null, lng: string | null, address: string | null) {
  if (lat && lng) return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  if (address) return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  return null;
}

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<Set<string>>(new Set());
  const router = useRouter();

  async function fetchRoute() {
    try {
      const res = await fetch(`/api/driver/routes?date=${getDateParam()}`);
      if (res.status === 401) {
        router.push("/driver");
        return;
      }
      const data = await res.json();
      const found = (data.routes as RouteDetail[])?.find((r) => r.id === id);
      if (found) setRoute(found);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleCheckIn(passengerId: string) {
    if (!route) return;
    setCheckingIn((prev) => new Set(prev).add(passengerId));

    try {
      const passenger = route.passengers.find((p) => p.id === passengerId);
      if (!passenger) return;

      const res = await fetch("/api/driver/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingPassengerId: passengerId,
          checkedIn: !passenger.checkedIn,
        }),
      });

      if (res.ok) {
        setRoute((prev) => {
          if (!prev) return prev;
          const updated = prev.passengers.map((p) =>
            p.id === passengerId ? { ...p, checkedIn: !p.checkedIn } : p
          );
          return {
            ...prev,
            passengers: updated,
            checkedInCount: updated.filter((p) => p.checkedIn).length,
          };
        });
      }
    } catch {
      // ignore
    } finally {
      setCheckingIn((prev) => {
        const next = new Set(prev);
        next.delete(passengerId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-warm-500">Ruta no encontrada</p>
        <button
          onClick={() => router.push("/driver/routes")}
          className="mt-4 text-primary-600 font-medium"
        >
          Volver a mis rutas
        </button>
      </div>
    );
  }

  const googleUrl = getGoogleMapsUrl(route.meetingPointLat, route.meetingPointLng, route.meetingPoint);
  const wazeUrl = getWazeUrl(route.meetingPointLat, route.meetingPointLng, route.meetingPoint);
  const allCheckedIn = route.checkedInCount === route.totalPax && route.totalPax > 0;
  const paxProgress = route.totalPax > 0
    ? Math.round((route.checkedInCount / route.totalPax) * 100)
    : 0;

  return (
    <div className="pb-8">
      {/* Back + Header */}
      <div className="sticky top-14 z-40 bg-warm-50/95 backdrop-blur-sm border-b border-warm-200 px-4 py-3">
        <button
          onClick={() => router.push("/driver/routes")}
          className="flex items-center gap-1 text-sm text-primary-600 font-medium mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Mis Rutas
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-warm-900">{route.tourName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-warm-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {route.departureTime}
              </span>
              <span>{route.duration}min</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                route.role === "DRIVER" ? "bg-blue-100 text-blue-700" :
                route.role === "GUIDE" ? "bg-amber-100 text-amber-700" :
                "bg-purple-100 text-purple-700"
              }`}>
                {ROLE_LABELS[route.role]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Navigation section */}
        {route.meetingPoint && (
          <div className="rounded-2xl bg-white border border-warm-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Punto de encuentro</p>
                <p className="mt-0.5 font-medium text-warm-900">{route.meetingPoint}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {googleUrl && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors active:scale-[0.98]"
                >
                  <Map className="h-4 w-4" />
                  Google Maps
                </a>
              )}
              {wazeUrl && (
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-50 border border-cyan-200 py-2.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors active:scale-[0.98]"
                >
                  <Navigation className="h-4 w-4" />
                  Waze
                </a>
              )}
            </div>
          </div>
        )}

        {/* Team info */}
        {(route.guide || route.driver || route.vehicle) && (
          <div className="rounded-2xl bg-white border border-warm-200 p-4 space-y-3">
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Equipo</p>
            {route.guide && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <Navigation className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-900">{route.guide.name}</p>
                    <p className="text-xs text-warm-500">Guía</p>
                  </div>
                </div>
                {route.guide.phone && (
                  <a
                    href={`tel:${route.guide.phone}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
            {route.driver && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-900">{route.driver.name}</p>
                    <p className="text-xs text-warm-500">Conductor</p>
                  </div>
                </div>
                {route.driver.phone && (
                  <a
                    href={`tel:${route.driver.phone}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
            {route.vehicle && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-100">
                  <span className="text-sm">🚐</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-900">{route.vehicle.name}</p>
                  <p className="text-xs text-warm-500">{route.vehicle.plate} · {route.vehicle.capacity} asientos</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client notes */}
        {route.clientNotes && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2">
              <StickyNote className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Notas del cliente</p>
                <p className="mt-1 text-sm text-amber-900">{route.clientNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Check-in progress */}
        <div className="rounded-2xl bg-white border border-warm-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold text-warm-900">
                Pasajeros ({route.checkedInCount}/{route.totalPax})
              </h2>
            </div>
            {allCheckedIn && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Completo
              </span>
            )}
          </div>

          <div className="h-2 rounded-full bg-warm-100 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allCheckedIn ? "bg-emerald-500" : "bg-primary-500"}`}
              style={{ width: `${paxProgress}%` }}
            />
          </div>

          {/* Passenger list */}
          <div className="space-y-2">
            {route.passengers.map((p) => {
              const isChecking = checkingIn.has(p.id);

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    p.checkedIn
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-warm-50 border-warm-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleCheckIn(p.id)}
                        disabled={isChecking}
                        className="shrink-0"
                      >
                        {isChecking ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                        ) : p.checkedIn ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-warm-300 hover:text-primary-400 transition-colors" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate ${p.checkedIn ? "text-emerald-900" : "text-warm-900"}`}>
                            {p.name}
                          </span>
                          {p.seatNumber && (
                            <span className="shrink-0 text-[10px] font-medium bg-warm-200 text-warm-600 rounded px-1.5 py-0.5">
                              #{p.seatNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-warm-500">
                          {p.paxType === "CHILD" ? (
                            <Baby className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span>{p.paxType === "CHILD" ? "Niño" : "Adulto"}</span>
                          <Globe className="h-3 w-3" />
                          <span>{p.nationality}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-warm-400 hover:bg-white hover:text-emerald-600 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {p.phone && (
                        <a
                          href={`https://wa.me/${p.phone.replace(/[^0-9+]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-warm-400 hover:bg-white hover:text-green-600 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Special needs / notes */}
                  {(p.specialNeeds || p.notes) && (
                    <div className="mt-2 ml-9 space-y-1">
                      {p.specialNeeds && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {p.specialNeeds}
                        </div>
                      )}
                      {p.notes && (
                        <div className="flex items-center gap-1.5 text-xs text-warm-500 bg-warm-100 rounded-lg px-2 py-1">
                          <StickyNote className="h-3 w-3 shrink-0" />
                          {p.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick action: check all */}
        {!allCheckedIn && route.passengers.some((p) => !p.checkedIn) && (
          <Button
            onClick={async () => {
              const unchecked = route.passengers.filter((p) => !p.checkedIn);
              for (const p of unchecked) {
                await toggleCheckIn(p.id);
              }
            }}
            className="w-full"
            size="lg"
          >
            <CheckCircle2 className="h-4 w-4" />
            Check-in todos ({route.passengers.filter((p) => !p.checkedIn).length} pendientes)
          </Button>
        )}

        {/* WhatsApp Quick Messages */}
        <WhatsAppTemplates route={route} />
      </div>
    </div>
  );
}

function WhatsAppTemplates({ route }: { route: RouteDetail }) {
  const [copied, setCopied] = useState<string | null>(null);
  const passengersWithPhone = route.passengers.filter((p) => p.phone);

  const templates = [
    {
      id: "pickup",
      label: "Aviso de recogida",
      icon: "🚐",
      getMessage: (name: string) =>
        `Hola ${name}! 👋 Soy su conductor/guía para el tour "${route.tourName}" de hoy. Estaremos en ${route.meetingPoint || "el punto de encuentro"} a las ${route.departureTime}. ¡Nos vemos pronto!`,
    },
    {
      id: "delay",
      label: "Aviso de retraso",
      icon: "⏰",
      getMessage: (name: string) =>
        `Hola ${name}, le informamos que hay un pequeño retraso en la salida del tour "${route.tourName}". Llegaremos en unos minutos. Disculpe las molestias. 🙏`,
    },
    {
      id: "reminder",
      label: "Recordatorio",
      icon: "📋",
      getMessage: (name: string) =>
        `Hola ${name}! 🌟 Le recordamos que mañana tiene el tour "${route.tourName}" con salida a las ${route.departureTime} desde ${route.meetingPoint || "el punto de encuentro"}. No olvide traer protector solar, agua y ropa cómoda. ¡Será un gran día!`,
    },
    {
      id: "thanks",
      label: "Agradecimiento",
      icon: "⭐",
      getMessage: (name: string) =>
        `Hola ${name}! Gracias por acompañarnos en el tour "${route.tourName}" 🏔️ Esperamos que haya disfrutado la experiencia. Si tiene un momento, nos encantaría recibir su opinión. ¡Hasta pronto! ⭐`,
    },
  ];

  function copyMessage(templateId: string, message: string) {
    navigator.clipboard.writeText(message);
    setCopied(templateId);
    setTimeout(() => setCopied(null), 2000);
  }

  if (passengersWithPhone.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-warm-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-green-600" />
        <h2 className="font-semibold text-warm-900">Mensajes Rápidos</h2>
      </div>
      <p className="text-xs text-warm-500 mb-3">
        Envía mensajes predefinidos por WhatsApp a los pasajeros
      </p>

      <div className="space-y-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-xl bg-warm-50 border border-warm-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-warm-900">
                {tpl.icon} {tpl.label}
              </span>
              <button
                onClick={() => copyMessage(tpl.id, tpl.getMessage("Pasajero"))}
                className="flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 transition-colors"
              >
                {copied === tpl.id ? (
                  <><Check className="h-3 w-3 text-emerald-500" /> Copiado</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copiar</>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {passengersWithPhone.map((p) => (
                <a
                  key={p.id}
                  href={`https://wa.me/${p.phone!.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(tpl.getMessage(p.name.split(" ")[0]))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors active:scale-95"
                >
                  <Send className="h-3 w-3" />
                  {p.name.split(" ")[0]}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDateParam() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
