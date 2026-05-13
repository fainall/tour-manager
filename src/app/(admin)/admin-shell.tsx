"use client";

import { AppShell } from "@/components/layout/app-shell";
import type { UserRole } from "@/generated/prisma/client";

type AdminShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    avatarUrl?: string | null;
  };
};

export function AdminShell({ children, user }: AdminShellProps) {
  return <AppShell user={user}>{children}</AppShell>;
}
