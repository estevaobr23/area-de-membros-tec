import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import {
  FINANCE_CATEGORIES,
  FINANCE_CATEGORY_LABELS,
} from "@/lib/tools/finance";
import { createFinanceTransactionAction } from "../actions";

export default async function NovaMovimentacaoPage({
  searchParams,
}: PageProps<"/ferramentas/financeiro/novo">) {
  await requireCustomer();
  const access = await getToolAccess("financeiro");
  if (!access.canWrite) redirect("/ferramentas/financeiro?bloqueado=1");
  const { error } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href="/ferramentas/financeiro"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Financeiro
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nova movimentação
        </h1>
      </div>

      {error === "campos" && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Preencha tipo, descrição e um valor maior que zero.
        </p>
      )}

      <form action={createFinanceTransactionAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <NativeSelect id="type" name="type" required defaultValue="receita">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <NativeSelect id="category" name="category" defaultValue="servicos">
              <optgroup label="Receitas">
                {FINANCE_CATEGORIES.receita.map((c) => (
                  <option key={c} value={c}>
                    {FINANCE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Despesas">
                {FINANCE_CATEGORIES.despesa.map((c) => (
                  <option key={c} value={c}>
                    {FINANCE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </optgroup>
            </NativeSelect>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            name="description"
            required
            placeholder="Troca de tela iPhone 11, compra de película…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry_date">Data</Label>
            <Input id="entry_date" name="entry_date" type="date" defaultValue={today} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observação</Label>
          <Textarea id="notes" name="notes" />
        </div>

        <Button type="submit">Salvar movimentação</Button>
      </form>
    </div>
  );
}
