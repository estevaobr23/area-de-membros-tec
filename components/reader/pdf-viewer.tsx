"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveReadingProgress } from "@/app/(reader)/produtos/[slug]/leitor/actions";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.2;

export function PdfViewer({
  fileUrl,
  downloadUrl,
  productId,
  productName,
  backHref,
  initialPage,
}: {
  fileUrl: string;
  downloadUrl: string | null;
  productId: string;
  productName: string;
  backHref: string;
  initialPage: number;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(scale);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function clampScale(value: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    // Medido num wrapper sem scroll (overflow-hidden), separado do elemento
    // que rola (containerRef) — senão o aparecimento/sumiço da barra de
    // rolagem ao dar zoom altera a largura observada, que muda o zoom, que
    // altera a barra de novo: um loop infinito que pisca a tela.
    const el = measureRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        saveReadingProgress(productId, page, numPages);
      });
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Zoom com Ctrl/Cmd + scroll (mouse com Ctrl, ou pinch de trackpad, que o
  // navegador reporta como wheel com ctrlKey=true).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setScale((s) => clampScale(s - e.deltaY * 0.01));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pinch-to-zoom em telas de toque.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function distance(touches: TouchList) {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinchRef.current = { distance: distance(e.touches), scale: scaleRef.current };
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const ratio = distance(e.touches) / pinchRef.current.distance;
        setScale(clampScale(pinchRef.current.scale * ratio));
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchRef.current = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  function goToPage(next: number) {
    if (!numPages) return;
    const clamped = Math.min(Math.max(1, next), numPages);
    setPage(clamped);
    setPageInput(String(clamped));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      shellRef.current?.requestFullscreen();
    }
  }

  const pageWidth = Math.min(containerWidth || 800, 900) * scale;

  return (
    <div
      ref={shellRef}
      className="flex h-svh flex-col bg-muted/40 dark:bg-background"
    >
      <header className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={backHref} />}
          nativeButton={false}
          aria-label="Voltar"
        >
          <ArrowLeft />
        </Button>

        <p className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
          {productName}
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToPage(parseInt(pageInput) || page);
            }}
            className="flex items-center gap-1"
          >
            <Input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => goToPage(parseInt(pageInput) || page)}
              inputMode="numeric"
              className="h-8 w-14 text-center tabular-nums"
              aria-label="Página atual"
            />
            <span className="text-sm text-muted-foreground tabular-nums">
              / {numPages ?? "…"}
            </span>
          </form>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(page + 1)}
            disabled={!numPages || page >= numPages}
            aria-label="Próxima página"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale((s) => clampScale(s - SCALE_STEP))}
            disabled={scale <= MIN_SCALE}
            aria-label="Diminuir zoom"
          >
            <ZoomOut />
          </Button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="w-11 shrink-0 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground"
            aria-label="Redefinir zoom para 100%"
            title="Redefinir zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale((s) => clampScale(s + SCALE_STEP))}
            disabled={scale >= MAX_SCALE}
            aria-label="Aumentar zoom"
          >
            <ZoomIn />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>
      </header>

      {downloadUrl && (
        <div className="flex justify-center border-b bg-background px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href={downloadUrl} download />}
            nativeButton={false}
          >
            <Download />
            Baixar PDF para imprimir
          </Button>
        </div>
      )}

      <div ref={measureRef} className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="h-full overflow-auto"
          style={{ touchAction: "pan-y" }}
        >
          <div className="flex min-h-full justify-center py-4">
            {error ? (
              <p className="self-center px-4 text-center text-sm text-destructive">
                {error}
              </p>
            ) : (
              <Document
                file={fileUrl}
                onLoadSuccess={({ numPages: n }) => {
                  setNumPages(n);
                  setPage((p) => {
                    const clamped = Math.min(p, n);
                    setPageInput(String(clamped));
                    return clamped;
                  });
                }}
                onLoadError={() =>
                  setError(
                    "Não foi possível carregar o manual agora. Atualize a página para tentar de novo."
                  )
                }
                loading={
                  <div className="flex items-center gap-2 self-center py-16 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    Carregando manual…
                  </div>
                }
              >
                {containerWidth > 0 && (
                  <Page
                    key={page}
                    pageNumber={page}
                    width={pageWidth}
                    className="shadow-md"
                    loading={
                      <div className="flex h-[70vh] items-center justify-center text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    }
                  />
                )}
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
