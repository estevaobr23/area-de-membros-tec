import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/supabase/types";

export const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_DAYS = 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não configurado.");
  }
  return secret;
}

function hashToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

/**
 * Cria uma sessão para o cliente e grava o cookie httpOnly no navegador.
 * Deve ser chamada de dentro de uma Server Action ou Route Handler.
 */
export async function createSession(
  customerId: string,
  meta: { userAgent?: string | null; ip?: string | null }
) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  const supabase = createServiceClient();
  const { error } = await supabase.from("sessions").insert({
    customer_id: customerId,
    token_hash: tokenHash,
    user_agent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Falha ao criar sessão: ${error.message}`);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    // "none" em dev para o cookie sobreviver dentro de previews embutidos
    // (iframe do editor) — o Chromium trata http://localhost como origem
    // confiável, então "secure" funciona mesmo sem HTTPS. Em produção fica
    // "lax", que é a postura correta para o app em produção.
    secure: true,
    sameSite: isProduction ? "lax" : "none",
    path: "/",
    expires: expiresAt,
  });
}

/** Remove a sessão atual (banco + cookie). */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = createServiceClient();
    await supabase.from("sessions").delete().eq("token_hash", hashToken(token));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Retorna o cliente autenticado da requisição atual, ou null. Deduplicado por requisição. */
export const getCurrentCustomer = cache(async (): Promise<Customer | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("customer_id, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", session.customer_id)
    .maybeSingle();

  return customer ?? null;
});

/**
 * Igual a getCurrentCustomer, mas redireciona para /login se não houver
 * sessão. Uso padrão em Server Actions e páginas protegidas — a autorização
 * nunca confia em ids vindos do frontend, sempre parte da sessão.
 */
export async function requireCustomer(): Promise<Customer> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");
  return customer;
}

/**
 * Busca (ou não) um cliente elegível para login: precisa existir com esse
 * e-mail e ter ao menos um entitlement ativo (acesso liberado a algum
 * produto). Retorna null se não encontrado.
 */
export async function findLoginEligibleCustomer(
  email: string
): Promise<Customer | null> {
  const supabase = createServiceClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!customer) return null;

  const { count } = await supabase
    .from("entitlements")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer.id)
    .eq("status", "active");

  if (!count) return null;

  return customer;
}
