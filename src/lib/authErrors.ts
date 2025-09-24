import type { ReadonlyURLSearchParams } from "next/navigation";
import type { ZodIssue } from "zod";

type ErrorInfo = { message: string; showVerificationInfo?: boolean };

const credentialsSigninParamMap: Record<string, ErrorInfo> = {
  VERIFICATION_REQUIRED: {
    message: "Please verify your email before signing in",
    showVerificationInfo: true,
  },
  INVALID_CREDENTIALS: {
    message: "Invalid email/username or password",
  },
  DATABASE_ERROR: {
    message: "Database connection failed. Please try again later.",
  },
};

export function resolveSignInError(
  errorCode: string | undefined,
  searchParams: ReadonlyURLSearchParams
) {
  const fallback: ErrorInfo = { message: "An error occurred during sign in" };

  if (errorCode === "CredentialsSignin") {
    const key = (searchParams.get("error") || "").toUpperCase();
    const mapped = credentialsSigninParamMap[key];
    return mapped || { message: "Invalid email/username or password" };
  }

  if (errorCode === "OAuthError") {
    return { message: "Authentication service error. Please try again." };
  }

  if (errorCode === "AccessDenied") {
    return { message: "Access denied. Please check your credentials" };
  }

  return fallback;
}

export function mapIssuesToErrors(issues: ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path?.[0] !== undefined ? String(issue.path[0]) : "form";
    errors[key] = issue.message;
  }
  return errors;
}
