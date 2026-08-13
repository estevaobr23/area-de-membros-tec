import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function ClientesPage({
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/clientes">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const supabase = createServiceClient();
  let query = supabase
    .from("service_clients")
    .select("id, name, phone, email, created_at, service_orders(id)")
    .eq("customer_id", customer.id)
    .order("name")
    .limit(200);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: clients } = await query;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/ferramentas/ordem-servico"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Ordens de serviço
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Clientes da sua assistência técnica.
          </p>
        </div>
        {access.canWrite && (
          <Button
            render={<Link href="/ferramentas/ordem-servico/clientes/novo" />}
            nativeButton={false}
          >
            <Plus data-icon="inline-start" />
            Novo cliente
          </Button>
        )}
      </div>

      <form className="flex gap-2" action="/ferramentas/ordem-servico/clientes">
        <Input
          name="q"
          placeholder="Buscar por nome"
          defaultValue={q}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {!clients || clients.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/ferramentas/ordem-servico/clientes/${c.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {(c.service_orders ?? []).length}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(c.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
