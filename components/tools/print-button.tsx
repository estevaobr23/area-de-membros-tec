"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Imprime a área marcada com .print-doc (regras em globals.css).
 * "Salvar como PDF" do navegador cobre a geração de PDF sem lib extra.
 */
export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer data-icon="inline-start" />
      Imprimir / PDF
    </Button>
  );
}
