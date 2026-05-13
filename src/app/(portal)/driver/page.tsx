"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriverLoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresa tu email");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      const data = await res.json();
      localStorage.setItem("driver-session", JSON.stringify(data));
      router.push("/driver/routes");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-warm-900">Portal del Conductor</h1>
          <p className="mt-2 text-warm-500">Ingresa con tu email para ver tus rutas del día</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-warm-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-warm-300 bg-white py-3 pl-11 pr-4 text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-warm-400">
          Solo para conductores y guías registrados
        </p>
      </div>
    </div>
  );
}
