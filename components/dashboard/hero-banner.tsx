import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LatestReading } from "@/lib/data/products";

/**
 * Banner de boas-vindas do dashboard, com "Continuar lendo" quando o
 * cliente tem progresso salvo no leitor.
 */
export function HeroBanner({
  name,
  reading,
  startSlug,
}: {
  name: string | null;
  /** Leitura mais recente (só passar se o cliente ainda tem acesso ao produto). */
  reading: LatestReading | null;
  /** Slug para "Começar a ler" quando não há progresso ainda. */
  startSlug: string | null;
}) {
  const progressPercent =
    reading?.numPages && reading.numPages > 0
      ? Math.min(Math.round((reading.lastPage / reading.numPages) * 100), 100)
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 p-6 text-white shadow-xl sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* brilhos decorativos */}
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-300">
            Bem-vindo de volta
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Olá{name ? `, ${name}` : ""}!
          </h1>
        </div>

        {reading ? (
          <div className="space-y-3">
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Você parou na página{" "}
              <span className="font-semibold text-white">
                {reading.lastPage}
              </span>
              {reading.numPages ? ` de ${reading.numPages}` : ""} de{" "}
              <span className="font-semibold text-white">{reading.name}</span>.
            </p>
            {progressPercent !== null && (
              <div className="max-w-md space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-400 transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {progressPercent}% do manual
                </p>
              </div>
            )}
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100"
              render={<Link href={`/produtos/${reading.slug}/leitor`} />}
              nativeButton={false}
            >
              <BookOpen data-icon="inline-start" />
              Continuar lendo
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        ) : startSlug ? (
          <div className="space-y-3">
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Seu manual está pronto para você. Comece a diagnosticar e reparar
              com mais segurança hoje mesmo.
            </p>
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100"
              render={<Link href={`/produtos/${startSlug}/leitor`} />}
              nativeButton={false}
            >
              <BookOpen data-icon="inline-start" />
              Começar a ler
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        ) : (
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            Aqui está um resumo dos seus produtos e ferramentas.
          </p>
        )}
      </div>
    </div>
  );
}
