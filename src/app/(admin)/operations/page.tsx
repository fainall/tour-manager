import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OperationsPanel } from "./operations-panel";

export default async function OperationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!["ADMIN", "SALES_SUPERVISOR", "LOGISTICS"].includes(session.user.role)) {
    redirect("/");
  }

  return <OperationsPanel />;
}
