import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_token";
const PUBLIC_ROUTES = ["/login"];

/**
 * Checagem otimista (só olha o cookie, sem tocar no banco — Proxy roda em
 * toda rota, inclusive prefetch). A validação real da sessão acontece no
 * layout autenticado via getCurrentCustomer().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!hasSessionCookie && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Além das exclusões padrão, ignora arquivos estáticos de /public (ex:
  // imagens de capa dos produtos) — senão a busca interna do Next para
  // otimizar imagens (sem cookie de sessão) recebe um redirect pro /login
  // em vez do arquivo e a otimização falha ("not a valid image").
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)$).*)",
  ],
};
