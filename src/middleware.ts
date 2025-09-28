import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const hasValidSession = (request: NextRequest): boolean => {
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    return false;
  }

  return sessionToken.length > 10;
};

const isAuthenticated = async (request: NextRequest): Promise<boolean> => {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    return !!token && !!token.id;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const hasSession = hasValidSession(request);

    if (hasSession) {
      return NextResponse.redirect(new URL("/home", request.url));
    } else {
      return NextResponse.redirect(new URL("/authentication", request.url));
    }
  }

  if (
    pathname === "/global" ||
    pathname === "/leaderboard" ||
    pathname === "/home" ||
    pathname === "/play"
  ) {
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      return NextResponse.redirect(new URL("/authentication", request.url));
    }
  }

  if (pathname === "/authentication") {
    const authenticated = await isAuthenticated(request);

    if (authenticated) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brands|icons).*)"],
};
