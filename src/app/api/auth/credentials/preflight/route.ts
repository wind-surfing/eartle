import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "Identifier and password are required",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("authenticate_user", {
      p_identifier: identifier,
      p_password: password,
    });

    if (error) {
      console.error("Preflight auth error:", error);
      return NextResponse.json(
        {
          success: false,
          code: "DATABASE_ERROR",
          message: "Authentication service error",
        },
        { status: 500 }
      );
    }

    if (!data?.success) {
      if (data?.requires_verification) {
        return NextResponse.json(
          {
            success: false,
            code: "VERIFICATION_REQUIRED",
            message: data.error || "Please verify your email before signing in",
          },
          { status: 401 }
        );
      }
      const msg: string = data?.error || "Invalid email/username or password";
      const code =
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("user")
          ? "INVALID_CREDENTIALS"
          : "AUTH_FAILED";
      return NextResponse.json(
        { success: false, code, message: msg },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Preflight route error:", e);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
