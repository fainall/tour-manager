import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      commissionConfigs: {
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    documentId: u.documentId,
    role: u.role,
    isActive: u.isActive,
    avatarUrl: u.avatarUrl,
    commissionConfigs: u.commissionConfigs.map((c) => ({
      commissionType: c.commissionType,
      percentage: c.percentage ? c.percentage.toString() : null,
      fixedAmount: c.fixedAmount ? c.fixedAmount.toString() : null,
      goalTarget: c.goalTarget ? c.goalTarget.toString() : null,
      goalBonus: c.goalBonus ? c.goalBonus.toString() : null,
    })),
  }));

  return <UsersClient initialUsers={serialized} currentUserId={session.user.id} />;
}
