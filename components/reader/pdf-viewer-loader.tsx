"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// react-pdf (pdf.js) usa APIs de navegador (DOMMatrix, Path2D…) que não
// existem no Node — precisa rodar só no client. `ssr: false` só é aceito
// dentro de um Client Component, daí este arquivo separado.
export const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Carregando leitor…
      </div>
    ),
  }
);
