"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Map,
  Users,
  Bus,
  Receipt,
  Wallet,
  UserCog,
  BarChart3,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mountain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION, type NavItem } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import type { UserRole } from "@/generated/prisma/client";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Map,
  Users,
  Bus,
  Receipt,
  Wallet,
  UserCog,
  BarChart3,
  ClipboardList,
};

type SidebarProps = {
  user: {
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
  collapsed: boolean;
  onToggle: () => void;
};

function NavItemLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = ICON_MAP[item.icon] || LayoutDashboard;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        isActive
          ? "bg-primary-50 text-primary-600"
          : "text-warm-600 hover:bg-warm-100 hover:text-warm-900",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
      {isActive && !collapsed && (
        <span className="ml-auto h-2 w-2 rounded-full bg-primary-500" />
      )}
    </Link>
  );
}

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const roleLabels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    SALES_SUPERVISOR: "Supervisor",
    SELLER: "Vendedor",
    GUIDE: "Guía",
    DRIVER: "Conductor",
    LOGISTICS: "Logística",
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-warm-200 bg-white transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-warm-200 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white">
          <Mountain className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-warm-900">
            Tour Manager
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAVIGATION.map((section) => {
          const filteredItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(user.role)
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-warm-400">
                  {section.title}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {filteredItems.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href))
                    }
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-warm-200 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              src={user.avatarUrl}
              size="sm"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-warm-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-warm-500">
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              src={user.avatarUrl}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 items-center justify-center border-t border-warm-200 text-warm-400 transition-colors hover:bg-warm-50 hover:text-warm-600"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
