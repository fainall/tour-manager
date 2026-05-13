import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SALES_SUPERVISOR"].includes(session.user.role)) {
    redirect("/");
  }

  return <ReportsClient />;
}
