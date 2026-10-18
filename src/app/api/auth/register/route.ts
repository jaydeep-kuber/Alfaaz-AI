import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/auth";
import { validateConfirmPassword } from "@/src/lib/validation/auth";

/**
 * Dedicated registration endpoint for Alfaaz AUTH-2.
 * Acts as a thin wrapper around Better Auth's official signUpEmail API.
 * Better Auth before-hooks and database hooks enforce name rules,
 * email normalization, domain allowlist, password strength, and uniqueness.
 */
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { name, email, password, confirmPassword } = body || {};

    // 1. Validate Confirm Password (UI form concern; not an account property in Better Auth)
    const confirmRes = validateConfirmPassword(password, confirmPassword);
    if (!confirmRes.valid) {
      return NextResponse.json(
        {
          error: confirmRes.error || "Passwords do not match.",
          fieldErrors: { confirmPassword: confirmRes.error || "Passwords do not match." },
        },
        { status: 400 }
      );
    }

    // 2. Delegate to Better Auth built-in sign-up
    // All name, email domain, uniqueness, and password checks run in Better Auth's before-hook
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: typeof name === "string" ? name.trim() : "",
          email: typeof email === "string" ? email.trim().toLowerCase() : "",
          password: String(password || ""),
        },
      });

      if (!result?.user) {
        return NextResponse.json(
          { error: "Failed to create account. Please try again." },
          { status: 500 }
        );
      }

      // Return success without creating a session or setting session cookies
      return NextResponse.json(
        {
          success: true,
          message: "Account created. Sign in to verify your email.",
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            emailVerified: result.user.emailVerified ?? false,
          },
        },
        { status: 201 }
      );
    } catch (authError: any) {
      const errorMsg = String(authError?.message || "");

      // Handle duplicate email (Better Auth error or Postgres uniqueness violation)
      const isDuplicate =
        errorMsg.includes("already registered") ||
        errorMsg.includes("already exists") ||
        errorMsg.includes("duplicate") ||
        authError?.code === "23505" ||
        authError?.status === 409 ||
        authError?.statusCode === 409;

      if (isDuplicate) {
        return NextResponse.json(
          {
            error: "This email is already registered.",
            fieldErrors: { email: "This email is already registered." },
          },
          { status: 409 }
        );
      }

      // Handle internal database connection or query errors without leaking details
      if (
        errorMsg.includes("Failed query") ||
        errorMsg.includes("connect ECONNREFUSED") ||
        errorMsg.includes("connection")
      ) {
        console.error("[Registration Error] Database error:", errorMsg);
        return NextResponse.json(
          { error: "Database service unavailable. Please ensure PostgreSQL is running." },
          { status: 503 }
        );
      }

      // Return hook validation message (e.g., disallowed domain, weak password, invalid name)
      if (authError?.message) {
        const status =
          typeof authError.statusCode === "number"
            ? authError.statusCode
            : authError.status === "BAD_REQUEST"
              ? 400
              : 400;

        return NextResponse.json(
          {
            error: authError.message,
            fieldErrors: authError.message.includes("email")
              ? { email: authError.message }
              : authError.message.includes("Password")
                ? { password: authError.message }
                : authError.message.includes("Name")
                  ? { name: authError.message }
                  : undefined,
          },
          { status }
        );
      }

      return NextResponse.json(
        { error: "An unexpected error occurred during account creation." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
