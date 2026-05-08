import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return NextResponse.next();

  const cookie = request.cookies.get("acorn_admin")?.value;
  const queryKey = request.nextUrl.searchParams.get("key");

  if (cookie === adminKey || queryKey === adminKey) {
    const response = NextResponse.next();
    if (queryKey === adminKey && cookie !== adminKey) {
      response.cookies.set("acorn_admin", adminKey, { httpOnly: true, sameSite: "strict" });
    }
    return response;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
