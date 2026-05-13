"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Truck, LogOut } from "lucide-react";

type DriverSession = {
  id: string;
  name: string;
  role: string;
};

const DriverContext = createContext<DriverSession | null>(null);
export function useDriver() {
  return useContext(DriverContext);
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DriverSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("driver-session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const isLoginPage = pathname === "/driver";
  const showHeader = session && !isLoginPage;

  function handleLogout() {
    localStorage.removeItem("driver-session");
    document.cookie = "driver-session=; path=/; max-age=0";
    setSession(null);
    router.push("/driver");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <DriverContext.Provider value={session}>
      <div className="min-h-screen bg-warm-50">
        {showHeader && (
          <header className="sticky top-0 z-50 border-b border-warm-200 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
              <button
                onClick={() => router.push("/driver/routes")}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-warm-900 leading-tight">Mis Rutas</p>
                  <p className="text-[11px] text-warm-500 leading-tight">{session.name}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-warm-500 hover:bg-warm-100 hover:text-warm-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </header>
        )}

        <main className="mx-auto max-w-lg">
          {children}
        </main>
      </div>
    </DriverContext.Provider>
  );
}
