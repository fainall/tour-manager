"use client";

import { useRef } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SearchPalette, type SearchPaletteHandle } from "./search-palette";
import type { UserRole } from "@/generated/prisma/client";

type TopbarProps = {
  user: {
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
  onMenuToggle: () => void;
};

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  const searchRef = useRef<SearchPaletteHandle>(null);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-warm-200 bg-white px-4 lg:px-6">
        {/* Left: Mobile menu + Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            <button
              onClick={() => searchRef.current?.open()}
              className="relative flex items-center"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
              <div className="h-10 w-80 rounded-full border border-warm-200 bg-warm-50 pl-10 pr-4 flex items-center text-sm text-warm-400 transition-colors hover:border-warm-300 hover:bg-warm-100 cursor-pointer">
                Buscar reservas, pasajeros, tours...
              </div>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-warm-200 bg-warm-100 px-1.5 py-0.5 text-[10px] font-medium text-warm-500">
                Ctrl+K
              </kbd>
            </button>
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => searchRef.current?.open()}
            className="rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700 sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <button className="relative rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500" />
          </button>

          <div className="ml-2 hidden items-center gap-3 sm:flex">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              src={user.avatarUrl}
              size="sm"
            />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-warm-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <SearchPalette ref={searchRef} />
    </>
  );
}
