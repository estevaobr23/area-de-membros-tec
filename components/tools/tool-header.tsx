import { cn } from "@/lib/utils";
import { getToolIdentity } from "@/lib/config/tool-identity";
import type { ToolKey } from "@/lib/auth/tool-access";

/**
 * Cabeçalho padrão das páginas de ferramenta, com a identidade visual
 * única de cada uma (ícone em tile gradiente + cor própria).
 */
export function ToolHeader({
  tool,
  subtitle,
  badge,
  actions,
}: {
  tool: ToolKey;
  /** Substitui a descrição padrão da ferramenta quando informado. */
  subtitle?: string;
  /** Ex.: <ToolAccessBadge access={access} /> */
  badge?: React.ReactNode;
  /** Botões à direita (Nova OS, Novo orçamento…). */
  actions?: React.ReactNode;
}) {
  const identity = getToolIdentity(tool);
  const Icon = identity.icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg sm:size-12",
            identity.gradient
          )}
        >
          <Icon className="size-5 sm:size-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {identity.title}
            </h1>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            {subtitle ?? identity.tagline}
          </p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
