"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MdOutlineMail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import PasswordToggle from "@/components/PasswordToggle";
import SocialAuth from "@/components/SocialAuth";
import UsernameField from "@/components/UsernameField";
import { signUpAction } from "@/actions/signUpActions";
import { sendVerificationEmailAction } from "@/actions/verificationActions";
import { signInSchema } from "@/schemas/signInSchema";
import { signUpSchema } from "@/schemas/signUpSchema";
import type { AuthData } from "@/types/api.types";
import { signIn } from "next-auth/react";
import { resolveSignInError, mapIssuesToErrors } from "@/lib/authErrors";

interface AuthenticationFormsProps {
  initialMode?: "signin" | "signup";
}

export default function AuthenticationForms({
  initialMode = "signin",
}: AuthenticationFormsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});

  const isSignUp = mode === "signup";

  const isValidSignupResponse = (user?: AuthData["user"], code?: string) => {
    return Boolean(user?.email && user?.username && code);
  };

  const sendSignupVerificationEmail = async (
    email: string,
    username: string,
    verificationCode: string
  ) => {
    toast.loading("Sending verification email...", { id: "email" });
    try {
      const emailResponse = await sendVerificationEmailAction({
        email,
        username,
        verificationCode,
        type: "verification",
      });
      if (emailResponse?.success) {
        toast.success("Verification email sent! Check your inbox", {
          id: "email",
        });
      } else {
        toast.warning(
          emailResponse?.message ||
            "Account created but email failed to send. You can request a new code later.",
          {
            id: "email",
            duration: 5000,
          }
        );
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      toast.warning("Account created but email failed to send", {
        id: "email",
      });
    }
  };
  const handleSignIn = async (formData: FormData) => {
    setIsSignInLoading(true);
    setSignInErrors({});

    try {
      const formValues = {
        identifier: (formData.get("identifier") as string)?.trim() || "",
        password: (formData.get("password") as string) || "",
      };

      const validation = signInSchema.safeParse(formValues);

      if (!validation.success) {
        console.log("Sign-in validation failed:", validation.error.issues);
        console.log("Sign-in form values:", formValues);
        const errors = mapIssuesToErrors(validation.error.issues);
        setSignInErrors(errors);
        toast.error("Please fix the validation errors");
        return;
      }

      if (!formValues.identifier || !formValues.password) {
        setSignInErrors({
          identifier: !formValues.identifier
            ? "Email or username is required"
            : "",
          password: !formValues.password ? "Password is required" : "",
        });
        toast.error("Please fill in all required fields");
        return;
      }

      toast.loading("Checking your account...", { id: "signin" });
      const preflight = await fetch("/api/auth/credentials/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formValues.identifier,
          password: formValues.password,
        }),
      });

      const preflightData = await preflight.json().catch(() => null);

      if (!preflight.ok || !preflightData?.success) {
        const code = preflightData?.code as string | undefined;
        const message =
          (preflightData?.message as string | undefined) ||
          "Sign in failed. Please try again.";

        if (code === "VERIFICATION_REQUIRED") {
          toast.error(message, {
            id: "signin",
            action: {
              label: "Verify now",
              onClick: () =>
                router.push(
                  `/authentication/verify-email/${encodeURIComponent(
                    formValues.identifier
                  )}`
                ),
            },
            duration: 5000,
          });
          return;
        }

        toast.error(message, { id: "signin" });
        return;
      }

      toast.loading("Signing you in...", { id: "signin" });
      const response = await signIn("credentials", {
        redirect: false,
        identifier: formValues.identifier,
        password: formValues.password,
      });

      if (response?.ok) {
        toast.success("Welcome back!", { id: "signin" });
        window.location.href = "/home";
      } else if (response?.error) {
        const { message } = resolveSignInError(response.error, searchParams);
        toast.error(message, { id: "signin" });
      } else {
        toast.error("An unexpected error occurred. Please try again.", {
          id: "signin",
        });
      }
    } catch (error) {
      console.error("Sign in error:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(
          "Network error. Please check your connection and try again.",
          {
            id: "signin",
          }
        );
      } else if (error instanceof Error) {
        toast.error(
          error.message || "An unexpected error occurred. Please try again.",
          {
            id: "signin",
          }
        );
      } else {
        toast.error("An unexpected error occurred. Please try again.", {
          id: "signin",
        });
      }
    } finally {
      setIsSignInLoading(false);
    }
  };

  const handleSignUp = async (formData: FormData) => {
    setIsSignUpLoading(true);
    setSignUpErrors({});

    try {
      const formValues = {
        username: (formData.get("userName") as string)?.trim() || "",
        email: (formData.get("email") as string)?.trim() || "",
        password: (formData.get("password") as string) || "",
      };

      const validation = signUpSchema.safeParse(formValues);

      if (!validation.success) {
        console.log("Validation failed:", validation.error.issues);
        console.log("Form values:", formValues);
        const errors = mapIssuesToErrors(validation.error.issues);
        setSignUpErrors(errors);
        toast.error("Please fix the validation errors");
        return;
      }

      if (!formValues.username || !formValues.email || !formValues.password) {
        setSignUpErrors({
          username: !formValues.username ? "Username is required" : "",
          email: !formValues.email ? "Email is required" : "",
          password: !formValues.password ? "Password is required" : "",
        });
        toast.error("Please fill in all required fields");
        return;
      }

      toast.loading("Creating your account...", { id: "signup" });
      const response = await signUpAction(formData);

      if (response.success) {
        const responseData = response.data as AuthData;
        const { verification_code, user } = responseData;
        if (!isValidSignupResponse(user, verification_code)) {
          toast.error("Account created but verification setup failed", {
            id: "signup",
          });
          return;
        }
        toast.success("Account created successfully!", { id: "signup" });
        await sendSignupVerificationEmail(
          user!.email,
          user!.username,
          verification_code!
        );
        router.push(`/authentication/verify-email/${user!.username}`);
      } else {
        toast.error(response.message || "Sign up failed", { id: "signup" });

        if (response.message?.includes("email")) {
          toast.info("Try signing in instead if you already have an account", {
            duration: 4000,
          });
        } else if (response.message?.includes("username")) {
          toast.info("Please try a different username", {
            duration: 4000,
          });
        }
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        id: "signup",
      });
    } finally {
      setIsSignUpLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-background mb-2">
          Welcome to Eartle
        </h1>
        <h2 className="text-xl font-semibold text-background/80">
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>
      </div>

      <form
        action={isSignUp ? handleSignUp : handleSignIn}
        className=""
        noValidate
      >
        {isSignUp && (
          <FormItem>
            <UsernameField />
            {signUpErrors.username && (
              <FormMessage className="text-red-500 text-sm mt-1">
                {signUpErrors.username}
              </FormMessage>
            )}
          </FormItem>
        )}

        <FormItem>
          <div className="input-field bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            <MdOutlineMail className="icon text-gray-600 dark:text-gray-300" />
            <input
              name={isSignUp ? "email" : "identifier"}
              type={isSignUp ? "email" : "text"}
              placeholder={isSignUp ? "Email" : "Email or Username"}
              required
              autoComplete={isSignUp ? "email" : "username"}
              disabled={isSignUp ? isSignUpLoading : isSignInLoading}
              aria-invalid={Boolean(
                isSignUp ? signUpErrors.email : signInErrors.identifier
              )}
              className={`${
                isSignUp
                  ? signUpErrors.email
                  : signInErrors.identifier
                  ? "border-red-500"
                  : ""
              } ${
                (isSignUp ? isSignUpLoading : isSignInLoading)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            />
          </div>
          {(isSignUp ? signUpErrors.email : signInErrors.identifier) && (
            <FormMessage className="text-red-500 text-sm mt-1">
              {isSignUp ? signUpErrors.email : signInErrors.identifier}
            </FormMessage>
          )}
        </FormItem>

        <FormItem>
          <PasswordToggle
            fieldName="password"
            placeholder="Password"
            icon={
              <RiLockPasswordLine className="icon text-gray-600 dark:text-gray-300" />
            }
          />
          {(isSignUp ? signUpErrors.password : signInErrors.password) && (
            <FormMessage className="text-red-500 text-sm mt-1">
              {isSignUp ? signUpErrors.password : signInErrors.password}
            </FormMessage>
          )}
        </FormItem>

        {!isSignUp && (
          <div className="text-right">
            <a
              href="/authentication/reset-password"
              className="text-sm text-background/70 hover:text-primary cursor-pointer hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSignUp ? isSignUpLoading : isSignInLoading}
          className="w-full my-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSignUp
            ? isSignUpLoading
              ? "Creating Account..."
              : "Sign Up"
            : isSignInLoading
            ? "Signing In..."
            : "Sign In"}
        </Button>

        <div className="">
          <SocialAuth />
        </div>
      </form>

      <div className="text-center mt-8">
        <p className="text-background/70">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignUp ? "signin" : "signup")}
            className="text-primary font-semibold cursor-pointer hover:underline focus:outline-none transition-colors"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
