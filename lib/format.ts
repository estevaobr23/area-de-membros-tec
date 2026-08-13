const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return brl.format(Number.isFinite(n) ? (n as number) : 0);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  // datas "date" do Postgres chegam como YYYY-MM-DD; evitar shift de fuso
  const d =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Converte campo numérico de formulário ("12,50" ou "12.50") em número >= 0. */
export function parseMoney(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? "").trim().replace(/\./g, "").replace(",", ".");
  // se não tinha vírgula, o replace de pontos quebrou decimais tipo "12.50"
  const plain = String(raw ?? "").trim();
  const n = plain.includes(",") ? parseFloat(s) : parseFloat(plain);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}
