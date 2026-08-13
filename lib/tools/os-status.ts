export const OS_STATUSES = [
  "recebido",
  "em_diagnostico",
  "aguardando_aprovacao",
  "aguardando_peca",
  "em_reparo",
  "pronto",
  "entregue",
  "cancelado",
] as const;

export type OsStatus = (typeof OS_STATUSES)[number];

export const OS_STATUS_LABELS: Record<OsStatus, string> = {
  recebido: "Recebido",
  em_diagnostico: "Em diagnóstico",
  aguardando_aprovacao: "Aguardando aprovação",
  aguardando_peca: "Aguardando peça",
  em_reparo: "Em reparo",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/** Classes de cor do badge por status (tokens do design system). */
export const OS_STATUS_STYLES: Record<OsStatus, string> = {
  recebido: "bg-secondary text-secondary-foreground",
  em_diagnostico: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  aguardando_aprovacao: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  aguardando_peca: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  em_reparo: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  pronto: "bg-green-500/15 text-green-700 dark:text-green-400",
  entregue: "bg-green-500/15 text-green-700 dark:text-green-400",
  cancelado: "bg-destructive/10 text-destructive",
};

/** Statuses considerados "concluídos" para fins de garantia/receita. */
export const OS_DONE_STATUSES: OsStatus[] = ["pronto", "entregue"];

export function isOsStatus(value: string): value is OsStatus {
  return (OS_STATUSES as readonly string[]).includes(value);
}

export function formatOsNumber(n: number) {
  return `OS-${String(n).padStart(4, "0")}`;
}
