import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getCurrentCustomer } from "@/lib/auth/session";

export default async function PerfilPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/login");
  }

  const memberSince = new Date(customer.created_at).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Seus dados de acesso à área de membros.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Dados da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground">E-mail</Label>
            <p>{customer.email}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Nome</Label>
            <p>{customer.name ?? "Não informado"}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Membro desde</Label>
            <p>{memberSince}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
