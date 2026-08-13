import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/auth/session";

// Camada CENTRAL de autorização das ferramentas. Toda regra de trial/plano
// vive aqui — páginas e actions só chamam getToolAccess / assertToolWrite.

export type ToolKey =
  | "ordem-servico"
  | "calculadora"
  | "financeiro"
  | "orcamento-garantia";

export type ToolAccessState = "free" | "trial" | "active" | "expired" | "locked";

export interface ToolAccess {
  state: ToolAccessState;
  /** Leitura é sempre permitida — histórico nunca some. */
  canRead: true;
  canWrite: boolean;
  /** Dias restantes de trial (null quando não se aplica). */
  daysLeft: number | null;
}

/**
 * Ferramentas liberadas sem trial. Hoje todas as 4 estão gratuitas — para
 * reativar trial/assinatura em alguma delas, basta tirá-la desta lista (a
 * lógica de trial em `tool_access` já existe e continua funcionando).
 */
const FREE_TOOLS: ReadonlySet<ToolKey> = new Set<ToolKey>([
  "ordem-servico",
  "calculadora",
  "financeiro",
  "orcamento-garantia",
]);

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Estado de acesso do cliente logado à ferramenta. Cria a linha de trial na
 * primeira visita (o relógio dos 7 dias começa aí). Cacheado por requisição.
 */
export const getToolAccess = cache(
  async (tool: ToolKey): Promise<ToolAccess> => {
    if (FREE_TOOLS.has(tool)) {
      return { state: "free", canRead: true, canWrite: true, daysLeft: null };
    }

    const customer = await getCurrentCustomer();
    if (!customer) redirect("/login");

    const supabase = createServiceClient();
    let { data: row } = await supabase
      .from("tool_access")
      .select("trial_days, trial_started_at, status, paid_until")
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (!row) {
      const { data: inserted } = await supabase
        .from("tool_access")
        .insert({ customer_id: customer.id })
        .select("trial_days, trial_started_at, status, paid_until")
        .single();
      row = inserted;
    }

    if (!row) {
      // falha inesperada de banco: nega escrita, mantém leitura
      return { state: "expired", canRead: true, canWrite: false, daysLeft: 0 };
    }

    if (row.status === "locked") {
      return { state: "locked", canRead: true, canWrite: false, daysLeft: null };
    }

    if (row.status === "active") {
      const paidOk = !row.paid_until || new Date(row.paid_until) > new Date();
      if (paidOk) {
        return { state: "active", canRead: true, canWrite: true, daysLeft: null };
      }
      // assinatura vencida cai na regra de trial/expirado abaixo
    }

    const trialEnd =
      new Date(row.trial_started_at).getTime() + row.trial_days * DAY_MS;
    const msLeft = trialEnd - Date.now();

    if (msLeft > 0) {
      return {
        state: "trial",
        canRead: true,
        canWrite: true,
        daysLeft: Math.ceil(msLeft / DAY_MS),
      };
    }

    return { state: "expired", canRead: true, canWrite: false, daysLeft: 0 };
  }
);

/**
 * Guarda de escrita para Server Actions. Se o acesso estiver expirado ou
 * travado, redireciona para a página da ferramenta com o paywall em destaque.
 */
export async function assertToolWrite(tool: ToolKey) {
  const access = await getToolAccess(tool);
  if (!access.canWrite) {
    redirect(`/ferramentas/${tool}?bloqueado=1`);
  }
  return access;
}
