import { NextResponse, type NextRequest } from "next/server";
import { roleHome, sectionForPath } from "@/domain/access/roles";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { applySecurityHeaders } from "@/lib/security-headers";
import { decryptSession, SESSION_COOKIE } from "@/server/auth/session";

function withSecurity(response: NextResponse): NextResponse {
  applySecurityHeaders(response.headers, process.env.NODE_ENV === "production");
  return response;
}

function isAuthHotPath(path: string): boolean {
  return (
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/login") ||
    path.startsWith("/register")
  );
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = clientIp(request);

  if (isAuthHotPath(path) && request.method === "POST") {
    const limited = rateLimit(`auth:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return withSecurity(
        NextResponse.json(
          { error: "Слишком много попыток. Подождите немного и попробуйте снова." },
          {
            status: 429,
            headers: { "Retry-After": String(limited.retryAfterSec) },
          },
        ),
      );
    }
  }

  if (path.startsWith("/catalog/photos/") || path.startsWith("/catalog/acts/")) {
    const limited = rateLimit(`media:${ip}`, 120, 60_000);
    if (!limited.ok) {
      return withSecurity(
        NextResponse.json(
          { error: "Слишком много запросов" },
          {
            status: 429,
            headers: { "Retry-After": String(limited.retryAfterSec) },
          },
        ),
      );
    }
  }

  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  const section = sectionForPath(path);

  if (section && !session) {
    const login = new URL("/login", request.nextUrl);
    login.searchParams.set("next", path);
    return withSecurity(NextResponse.redirect(login));
  }

  if (section && session && !section.roles.includes(session.role)) {
    return withSecurity(
      NextResponse.redirect(new URL(roleHome(session.role), request.nextUrl)),
    );
  }

  // /register оставляем открытым: иначе кнопки «Я завхоз/фрилансер» с главной
  // молча отбрасывают уже залогиненного пользователя обратно в кабинет роли.
  if (path === "/login" && session) {
    return withSecurity(
      NextResponse.redirect(new URL(roleHome(session.role), request.nextUrl)),
    );
  }

  return withSecurity(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|placeholders|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
