import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { head } from "@vercel/blob";
import { requireCustomer } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductContent } from "@/lib/config/product-content";

/**
 * Serve o PDF do manual: confere entitlement ativo e faz streaming a partir
 * do store privado do Vercel Blob (produção) ou, na ausência dele, do disco
 * local (ponte de emergência, só funciona em dev nesta máquina).
 *
 * Repassa o header Range em ambos os casos — o pdf.js só baixa os trechos
 * do arquivo que precisa pra renderizar a página atual; sem isso, ele
 * esperaria o PDF inteiro (98MB) chegar antes de mostrar qualquer coisa.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const customer = await requireCustomer();
  const { slug } = await params;

  const content = getProductContent(slug);
  if (!content.manualBlobPath && !content.manualLocalPath) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const supabase = createServiceClient();
  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("id, products!inner(slug)")
    .eq("customer_id", customer.id)
    .eq("status", "active")
    .eq("products.slug", slug)
    .maybeSingle();

  if (!entitlement) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const range = request.headers.get("range");
  const wantsDownload =
    content.allowDownload && new URL(request.url).searchParams.has("download");
  const contentDisposition = wantsDownload
    ? `attachment; filename="${slug}.pdf"`
    : "inline";

  if (content.manualBlobPath) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new NextResponse("Storage não configurado", { status: 500 });
    }

    let blobUrl: string;
    try {
      const meta = await head(content.manualBlobPath, { token });
      blobUrl = meta.url;
    } catch {
      return new NextResponse("Arquivo não encontrado no storage", {
        status: 404,
      });
    }

    const upstream = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(range ? { Range: range } : {}),
      },
    });

    if (!upstream.ok) {
      return new NextResponse("Arquivo não encontrado no storage", {
        status: 404,
      });
    }

    const headers = new Headers({
      "Content-Type": upstream.headers.get("content-type") || "application/pdf",
      "Content-Disposition": contentDisposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache",
      "Accept-Ranges": "bytes",
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  }

  const localPath = content.manualLocalPath!;
  if (!existsSync(localPath)) {
    return new NextResponse("Arquivo não encontrado no servidor", {
      status: 404,
    });
  }

  const stat = statSync(localPath);
  const match = range?.match(/bytes=(\d*)-(\d*)/);

  if (match) {
    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
    const stream = Readable.toWeb(
      createReadStream(localPath, { start, end })
    ) as ReadableStream;

    return new NextResponse(stream, {
      status: 206,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": contentDisposition,
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(localPath)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": contentDisposition,
    },
  });
}
