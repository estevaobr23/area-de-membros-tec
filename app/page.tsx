import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth/session";

export default async function RootPage() {
  const customer = await getCurrentCustomer();
  redirect(customer ? "/dashboard" : "/login");
}
