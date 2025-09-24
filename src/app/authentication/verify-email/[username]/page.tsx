"use client";

import { toast } from "sonner";
import { verifySchema } from "@/schemas/verifySchema";
import type { ApiResponse } from "@/types/api.types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SiGmail } from "react-icons/si";
import {
  verifyEmailAction,
  resendVerificationCodeAction,
} from "@/actions/verificationActions";
import Navbar from "@/components/Navbar";

function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const usernameParam = (params as Record<string, string | string[]>).username;
  const username = Array.isArray(usernameParam)
    ? usernameParam[0]
    : usernameParam;

  const maskEmail = useCallback((e: string) => {
    const [name, domain] = e.split("@");
    if (!name || !domain) return e;
    if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
    return `${name.slice(0, 2)}${"*".repeat(
      Math.max(3, name.length - 2)
    )}@${domain}`;
  }, []);
  const recipient = useMemo(() => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    return isEmail ? maskEmail(username) : username;
  }, [maskEmail, username]);

  const performVerify = useCallback(
    async (value: string) => {
      if (isSubmitting) return;
      setError(null);
      setIsSubmitting(true);
      try {
        const validation = verifySchema.safeParse({ code: value });
        if (!validation.success) {
          const first =
            validation.error.issues?.[0]?.message ||
            "Invalid code. Please enter the 6-character code.";
          setError(first);
          return;
        }

        const res: ApiResponse = await verifyEmailAction({
          identifier: username,
          verificationCode: value,
        });

        if (!res.success) {
          const msg = res.message || "Verification failed. Please try again.";
          setError(msg);
          toast.error(msg, { duration: 3000 });
          return;
        }

        toast.success(res.message ?? "Email verified successfully", {
          duration: 3000,
        });

        router.replace("/authentication?mode=signin");
      } catch {
        const msg = "An error occurred. Please try again.";
        setError(msg);
        toast.error(msg, { duration: 3000 });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router, username]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await performVerify(code);
  };

  useEffect(() => {
    const raw = searchParams.get("code");
    if (!raw) return;
    const normalized = raw.trim();
    if (!normalized) return;
    setCode(normalized);
    if (normalized.length === 6) void performVerify(normalized);
  }, [searchParams, performVerify]);

  const handleResend = async () => {
    try {
      toast.loading("Resending verification email...", { id: "resend" });
      const res = await resendVerificationCodeAction({ identifier: username });
      if (res.success) {
        toast.success("Verification code sent! Check your inbox", {
          id: "resend",
        });
      } else {
        const msg = res.message || "Failed to resend verification code";
        if (
          msg.toLowerCase().includes("15") ||
          msg.toLowerCase().includes("wait")
        ) {
          toast.info(
            "A code was recently sent. Please wait 15 minutes to request a new one.",
            { id: "resend", duration: 6000 }
          );
        } else {
          toast.error(msg, { id: "resend" });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to resend verification email", { id: "resend" });
    }
  };

  return (
    <div className="min-h-screen w-screen flex justify-center items-center px-4 bg-foreground text-background">
      <Navbar></Navbar>

      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <Image src="/brands/eartle.svg" alt="Eartle" width={36} height={36} />
          <h1 className="text-2xl sm:text-4xl font-semibold text-background">
            We emailed you a code
          </h1>
          <p className="text-background max-w-xl">
            We&apos;ve sent an email to{" "}
            <span className="font-semibold">{recipient}</span>. Enter the code
            here or tap the button in the email to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="flex justify-center">
            <div>
              <div className="flex flex-row items-center justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(val) => setCode(val.toUpperCase())}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  aria-label="6-character verification code"
                  aria-describedby="verify-help"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} autoFocus />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p id="verify-help" className="text-sm text-background mt-3">
                If you can&apos;t see the email, check your spam or junk folder.
              </p>
              {error && (
                <p className="text-sm text-primary mt-2" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full sm:w-auto bg-primary text-background"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Verify"
              )}
            </Button>

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
      </div>
    </div>
  );
}

export default Page;
