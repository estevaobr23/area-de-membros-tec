import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client com a service role key — só pode ser usado em código de servidor
 * (Server Actions, Route Handlers, Server Components). Ignora RLS, então a
 * autorização é feita na aplicação (ver lib/auth/session.ts).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
