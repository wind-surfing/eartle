"use server";

import { createUser } from "@/supabase/rpc/auth";
import { signUpSchema, type SignUpFormData } from "@/schemas/signUpSchema";
import type { ApiResponse } from "@/types/api.types";

export type { SignUpFormData };

export async function signUpAction(formData: FormData): Promise<ApiResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("userName") as string;

  console.log("signUpAction received:", { email, password, username });

  const validation = signUpSchema.safeParse({ email, password, username });

  if (!validation.success) {
    console.log("signUpAction validation failed:", validation.error.issues);
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input",
      data: {
        validationErrors: validation.error.issues,
      },
    };
  }

  try {
    const validatedData = validation.data;
    console.log("Calling createUser with validated data:", validatedData);

    const result = await createUser({
      email: validatedData.email,
      password: validatedData.password,
      username: validatedData.username,
    });

    console.log("createUser result:", result);

    if (!result?.success) {
      const errorMessage = result?.error || "Unknown error";

      if (errorMessage.toLowerCase().includes("email")) {
        return {
          success: false,
          message: "A user with this email already exists",
        };
      }

      if (
        errorMessage.toLowerCase().includes("username") ||
        errorMessage.toLowerCase().includes("user_name")
      ) {
        return {
          success: false,
          message: "This username is already taken",
        };
      }

      return {
        success: false,
        message: "Account creation failed. Please try again.",
      };
    }

    if (!result.user || !result.verification_code) {
      return {
        success: false,
        message: "Account creation incomplete. Please try again.",
      };
    }

    return {
      success: true,
      message: "Account created successfully! Please verify your email.",
      data: {
        verification_code: result.verification_code,
        user: result.user,
      },
    };
  } catch {
    return {
      success: false,
      message: "An unexpected error occurred during sign up",
    };
  }
}
