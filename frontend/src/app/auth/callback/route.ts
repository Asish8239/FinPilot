import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");

  const next =
    nextParam &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (!code) {
    const errorUrl = new URL(
      "/login",
      requestUrl.origin
    );

    errorUrl.searchParams.set(
      "error",
      "Authentication was cancelled or the authorization code was missing."
    );

    return NextResponse.redirect(errorUrl);
  }

  const supabase = createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "Supabase OAuth callback error:",
      error.message
    );

    const errorUrl = new URL(
      "/login",
      requestUrl.origin
    );

    errorUrl.searchParams.set(
      "error",
      "We couldn't complete the sign-in. Please try again."
    );

    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(
    new URL(next, requestUrl.origin)
  );
}