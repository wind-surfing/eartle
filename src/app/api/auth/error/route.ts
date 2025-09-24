import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error") || "OAuthError";
  const provider = url.searchParams.get("provider") || undefined;

  const params = new URLSearchParams({ mode: "signin", error });
  if (provider) params.set("provider", provider);

  return NextResponse.redirect(
    new URL(`/authentication?${params.toString()}`, url.origin)
  );
}

export const dynamic = "force-dynamic";
