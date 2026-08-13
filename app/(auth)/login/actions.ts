"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, findLoginEligibleCustomer } from "@/lib/auth/session";

const emailSchema = z.email();

export async function login(formData: FormData) {
  const rawEmail = String(formData.get("email") ?? "");
  const parsed = emailSchema.safeParse(rawEmail.trim().toLowerCase());

  if (!parsed.success) {
    redirect(`/login?error=invalid_email`);
  }

  const customer = await findLoginEligibleCustomer(parsed.data);

  if (!customer) {
    redirect(`/login?error=not_found`);
  }

  const headerList = await headers();
  await createSession(customer.id, {
    userAgent: headerList.get("user-agent"),
    ip: headerList.get("x-forwarded-for"),
  });

  redirect("/dashboard");
}
