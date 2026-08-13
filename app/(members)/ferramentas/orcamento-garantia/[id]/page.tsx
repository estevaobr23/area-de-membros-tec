import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { PrintButton } from "@/components/tools/print-button";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import type { PartItem } from "@/lib/supabase/types";
import { updateQuoteStatusAction, duplicateQuoteAction } from "../actions";

export default async function QuoteDetailPage({
  params,
}: PageProps<"/ferramentas/orcamento-garantia/[id]">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("orcamento-garantia");
  const { id } = await params;

  const supabase = createServiceClient();
  const [{ data: quote }, { data: profile }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle(),
    supabase
      .from("business_profiles")
      .select("*")
      .eq("customer_id", customer.id)
      .maybeSingle(),
  ]);

  if (!quote) notFound();

  const items = (quote.items ?? []) as PartItem[];
  const itemsSum = items.reduce((s, p) => s + p.qty * p.unit_price, 0);
  const number = `ORC-${String(quote.quote_number).padStart(4, "0")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/ferramentas/orcamento-garantia"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Orçamentos
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{number}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {access.canWrite && (
            <>
              <form action={updateQuoteStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={quote.id} />
                <NativeSelect name="status" defaultValue={quote.status} className="w-36">
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="recusado">Recusado</option>
                </NativeSelect>
                <Button type="submit" variant="outline" size="sm">
                  Salvar
                </Button>
              </form>
              <form action={duplicateQuoteAction}>
                <input type="hidden" name="id" value={quote.id} />
                <Button type="submit" variant="outline" title="Duplicar orçamento">
                  <Copy data-icon="inline-start" />
                  Duplicar
                </Button>
              </form>
            </>
          )}
          <PrintButton />
        </div>
      </div>

      <Card>
        <CardContent className="print-doc space-y-6 py-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">
                {profile?.business_name || "Sua assistência"}
              </p>
              <p className="text-sm text-muted-foreground">
                {[profile?.owner_name, profile?.phone, profile?.email]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {profile?.address && (
                <p className="text-sm text-muted-foreground">{profile.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">ORÇAMENTO {number}</p>
              <p className="text-sm text-muted-foreground">
                Emitido em {formatDate(quote.created_at)}
              </p>
              {quote.valid_until && (
                <p className="text-sm text-muted-foreground">
                  Válido até {formatDate(quote.valid_until)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{quote.client_name}</p>
            </div>
            {quote.device_label && (
              <div>
                <p className="text-sm text-muted-foreground">Aparelho</p>
                <p className="font-medium">{quote.device_label}</p>
              </div>
            )}
          </div>

          {quote.service_description && (
            <div>
              <p className="text-sm text-muted-foreground">Serviço proposto</p>
              <p>{quote.service_description}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            {items.map((p, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>
                  {p.qty}× {p.description}
                </span>
                <span className="tabular-nums">{formatBRL(p.qty * p.unit_price)}</span>
              </div>
            ))}
            {items.length > 0 && (
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span>Subtotal peças</span>
                <span className="tabular-nums">{formatBRL(itemsSum)}</span>
              </div>
            )}
            {Number(quote.labor_cost) > 0 && (
              <div className="flex justify-between gap-2">
                <span>Mão de obra</span>
                <span className="tabular-nums">{formatBRL(quote.labor_cost)}</span>
              </div>
            )}
            {Number(quote.discount) > 0 && (
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span>Desconto</span>
                <span className="tabular-nums">−{formatBRL(quote.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between gap-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatBRL(quote.total)}</span>
            </div>
          </div>

          {(quote.deadline || quote.notes) && (
            <div className="space-y-1 text-sm">
              {quote.deadline && <p>Prazo de execução: {quote.deadline}</p>}
              {quote.notes && <p>{quote.notes}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
