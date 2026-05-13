"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Map,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_TABS = [
  { label: "Inicio", href: "/", icon: LayoutDashboard },
  { label: "Reservas", href: "/bookings", icon: CalendarCheck },
  { label: "Calendario", href: "/calendar", icon: Calendar },
  { label: "Tours", href: "/tours", icon: Map },
  { label: "Más", href: "/more", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {MOBILE_TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary-500"
                  : "text-warm-400 hover:text-warm-600"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
