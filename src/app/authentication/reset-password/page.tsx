"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { MdOutlineMail, MdOutlineLock } from "react-icons/md";
import {
  initiatePasswordResetAction,
  resetPasswordAction,
} from "@/actions/verificationActions";
import PasswordToggle from "@/components/PasswordToggle";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiGmail } from "react-icons/si";
import Navbar from "@/components/Navbar";

function ResetPasswordContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token")?.trim() || "";

  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pwEmpty, setPwEmpty] = useState(true);
  const [cfEmpty, setCfEmpty] = useState(true);

  const isResetMode = !!token;

  const canSubmitInitiate = useMemo(() => {
    const id = identifier.trim();
    return id.length > 3 && id.length <= 254;
  }, [identifier]);

  async function handleInitiate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitInitiate) return;
    setSubmitting(true);
    try {
      const res = await initiatePasswordResetAction({
        identifier: identifier.trim(),
      });
      if (res?.success) {
        toast.success(
          res.message || "Password reset link sent. Check your email."
        );
      } else {
        toast.error(res?.message || "Failed to initiate password reset");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      if (!identifier.trim()) {
        toast.error("Enter your email or username first.");
        return;
      }
      const res = await initiatePasswordResetAction({
        identifier: identifier.trim(),
      });
      if (res?.success)
        toast.success(res.message || "Password reset link sent.");
      else toast.error(res?.message || "Failed to send reset link");
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.currentTarget as HTMLFormElement;
      const fd = new FormData(form);
      const pw = String(fd.get("newPassword") || "");
      const pw2 = String(fd.get("confirmPassword") || "");
      if (pw.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
      if (pw !== pw2) {
        toast.error("Passwords do not match.");
        return;
      }

      const res = await resetPasswordAction({
        identifier: undefined,
        newPassword: pw,
        verificationCode: token,
      });
      if (res?.success) {
        toast.success(
          res.message ||
            "Password reset successfully. Redirecting to sign in..."
        );
        setTimeout(() => router.push("/authentication/sign-in?reset=1"), 1200);
      } else {
        toast.error(res?.message || "Failed to reset password");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetFormInput(e: React.FormEvent<HTMLFormElement>) {
    const t = e.target as HTMLInputElement | null;
    if (!t) return;
    if (t.name === "newPassword") setPwEmpty(t.value.length === 0);
    if (t.name === "confirmPassword") setCfEmpty(t.value.length === 0);
  }

  return (
    <div className="min-h-screen w-screen flex justify-center items-center px-4 bg-foreground text-background">
      <Navbar></Navbar>

      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <Image src="/brands/eartle.svg" alt="Eartle" width={36} height={36} />
          <h1 className="text-2xl sm:text-4xl font-semibold">
            {isResetMode ? "Set a new password" : "Reset your password"}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {isResetMode
              ? "Set your new password using the secure link."
              : "We'll send a reset link if the account exists and is verified."}
          </p>
        </div>

        {!isResetMode ? (
          <form onSubmit={handleInitiate} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="identifier" className="block text-sm font-medium">
                Email or Username
              </label>
              <div className="input-field bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 flex items-center gap-2">
                <MdOutlineMail className="icon text-primary" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="Email or Username"
                  autoComplete="username"
                  disabled={submitting}
                  aria-invalid={false}
                  className="w-full bg-transparent text-sm focus:outline-none text-background"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={!canSubmitInitiate || submitting}
                className="w-full sm:w-auto bg-primary text-background"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <SiGmail className="h-5 w-5 text-primary" />
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary"
                >
                  Open Gmail
                </a>
              </div>

              <p className="text-sm text-background">
                Can&apos;t find your code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary cursor-pointer"
                >
                  Request a new code
                </button>
                .
              </p>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleReset}
            className="space-y-4 bg-foreground text-background"
            noValidate
            onInput={handleResetFormInput}
          >
            <div className="space-y-1">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-background"
              >
                New password
              </label>
              <PasswordToggle
                fieldName="newPassword"
                placeholder="At least 8 characters"
                className="rounded bg-background text-foreground"
                icon={<MdOutlineLock className="icon text-primary" />}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-background"
              >
                Confirm password
              </label>
              <PasswordToggle
                fieldName="confirmPassword"
                placeholder="Re-enter password"
                className="rounded bg-background text-foreground"
                icon={<MdOutlineLock className="icon text-primary" />}
              />
            </div>
            <input type="hidden" name="token" value={token} readOnly />
            <Button
              type="submit"
              disabled={submitting || (pwEmpty && cfEmpty)}
              className="w-full sm:w-auto bg-primary text-background"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
