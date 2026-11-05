import { NextResponse, type NextRequest } from "next/server";
import { roleHome, sectionForPath } from "@/domain/access/roles";
import { decryptSession, SESSION_COOKIE } from "@/server/auth/session";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  const section = sectionForPath(path);

  if (section && !session) {
    const login = new URL("/login", request.nextUrl);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (section && session && !section.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.nextUrl));
  }

  // /register оставляем открытым: иначе кнопки «Я завхоз/фрилансер» с главной
  // молча отбрасывают уже залогиненного пользователя обратно в кабинет роли.
  if (path === "/login" && session) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|placeholders|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
