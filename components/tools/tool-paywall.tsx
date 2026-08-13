import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ToolAccess } from "@/lib/auth/tool-access";

const STATE_LABELS: Record<string, string> = {
  expired: "Teste gratuito encerrado",
  locked: "Acesso bloqueado",
};

/**
 * Paywall reutilizável exibido quando a escrita está bloqueada.
 * O histórico continua visível (leitura nunca é bloqueada).
 */
export function ToolPaywall({
  toolName,
  benefit,
  access,
}: {
  toolName: string;
  benefit: string;
  access: ToolAccess;
}) {
  if (access.canWrite) return null;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-col gap-3 py-1">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-primary" />
          <p className="font-medium">
            {STATE_LABELS[access.state] ?? "Acesso bloqueado"} — {toolName}
          </p>
          <Badge variant="outline" className="ml-auto">
            {access.state === "expired" ? "Trial expirado" : "Bloqueado"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{benefit}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-green-600 dark:text-green-400" />
          Seus dados e histórico continuam salvos e visíveis — só novos
          registros ficam bloqueados.
        </p>
        <div>
          <Button size="sm" disabled title="O checkout do plano será ligado em breve">
            Assinar plano — em breve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Badge compacto do estado de acesso, usado no hub e nos cabeçalhos. */
export function ToolAccessBadge({ access }: { access: ToolAccess }) {
  switch (access.state) {
    case "free":
      return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">Grátis</Badge>;
    case "trial":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
          Teste — {access.daysLeft} {access.daysLeft === 1 ? "dia" : "dias"}
        </Badge>
      );
    case "active":
      return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">Plano ativo</Badge>;
    default:
      return <Badge variant="outline">Bloqueado</Badge>;
  }
}
