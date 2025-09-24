"use server";

import { createServerClient } from "@/supabase/server";
import type { ApiResponse } from "@/types/api.types";
import {
  verifyEmailSchema,
  resendVerificationCodeSchema,
  initiatePasswordResetSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
  type VerifyEmailFormData,
  type ResendVerificationCodeFormData,
  type InitiatePasswordResetFormData,
  type ResetPasswordFormData,
  type SendVerificationEmailFormData,
} from "@/schemas/verificationSchema";
import { sendEmails } from "@/lib/sendEmails";

export type {
  VerifyEmailFormData,
  ResendVerificationCodeFormData,
  InitiatePasswordResetFormData,
  ResetPasswordFormData,
  SendVerificationEmailFormData,
};

export async function verifyEmailAction(
  formData: VerifyEmailFormData
): Promise<ApiResponse> {
  const validation = verifyEmailSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input",
      data: { validationErrors: validation.error.issues },
    };
  }

  try {
    const validatedData = validation.data;
    const supabase = await createServerClient();

    const { data, error } = await supabase.rpc("verify_user_email", {
      p_identifier: validatedData.identifier,
      p_verification_code: validatedData.verificationCode,
    });

    if (error) {
      return {
        success: false,
        message: "Verification failed due to a technical error",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        message: data?.error || "Invalid verification code",
      };
    }

    return {
      success: true,
      message: "Email verified successfully! You can now sign in.",
    };
  } catch {
    return {
      success: false,
      message: "An unexpected error occurred during verification",
    };
  }
}
export async function resendVerificationCodeAction(
  formData: ResendVerificationCodeFormData
): Promise<ApiResponse> {
  const validation = resendVerificationCodeSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input",
      data: { validationErrors: validation.error.issues },
    };
  }

  try {
    const validatedData = validation.data;
    const supabase = await createServerClient();

    const { data, error } = await supabase.rpc("resend_verification_code", {
      p_identifier: validatedData.identifier,
    });

    if (error) {
      return {
        success: false,
        message: "Failed to resend verification code due to technical error",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        message: data?.error || "Failed to resend verification code",
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const emailResponse = await sendEmails({
      templateName: "verify-email",
      recipients: [{ email: data.email, username: data.username }],
      data: {
        verificationCode: data.verification_code,
        cta: {
          text: "Verify Email",
          url: `${baseUrl}/authentication/verify-email/${data.username}?code=${data.verification_code}`,
        },
      },
    });

    if (!emailResponse?.success) {
      return {
        success: false,
        message: "Verification code generated but failed to send email",
        data: { verification_code: data.verification_code },
      };
    }

    return {
      success: true,
      message: "New verification code sent to your email.",
      data: { verification_code: data.verification_code },
    };
  } catch {
    return {
      success: false,
      message: "An unexpected error occurred while resending verification code",
    };
  }
}

export async function initiatePasswordResetAction(
  formData: InitiatePasswordResetFormData
): Promise<ApiResponse> {
  const validation = initiatePasswordResetSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input",
      data: { validationErrors: validation.error.issues },
    };
  }

  try {
    const validatedData = validation.data;
    const supabase = await createServerClient();

    const { data, error } = await supabase.rpc("initiate_password_reset", {
      p_identifier: validatedData.identifier,
    });

    if (error) {
      return {
        success: false,
        message: "Failed to initiate password reset due to technical error",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        message: data?.error || "Failed to initiate password reset",
      };
    }

    const emailResponse = await sendEmails({
      templateName: "reset-password-email",
      recipients: [{ email: data.email, username: data.username }],
      data: { resetPasswordCode: data.verification_code },
    });

    if (!emailResponse?.success) {
      return {
        success: false,
        message: "Password reset code generated but failed to send email",
        data: { verification_code: data.verification_code },
      };
    }

    return {
      success: true,
      message: "Password reset link sent to your email.",
      data: { verification_code: data.verification_code },
    };
  } catch {
    return {
      success: false,
      message: "An unexpected error occurred while initiating password reset",
    };
  }
}

export async function resetPasswordAction(
  formData: ResetPasswordFormData
): Promise<ApiResponse> {
  const validation = resetPasswordSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input",
      data: { validationErrors: validation.error.issues },
    };
  }

  try {
    const validatedData = validation.data;
    const supabase = await createServerClient();

    const { data, error } = await supabase.rpc("reset_password", {
      p_identifier:
        validatedData.identifier && String(validatedData.identifier).trim()
          ? String(validatedData.identifier).trim()
          : null,
      p_new_password: validatedData.newPassword,
      p_verification_code: validatedData.verificationCode,
    });

    if (error) {
      return {
        success: false,
        message: "Failed to reset password due to technical error",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        message: data?.error || "Failed to reset password",
      };
    }

    return {
      success: true,
      message:
        "Password reset successfully! You can now sign in with your new password.",
    };
  } catch {
    return {
      success: false,
      message: "An unexpected error occurred during password reset",
    };
  }
}

export async function sendVerificationEmailAction(
  formData: SendVerificationEmailFormData
): Promise<ApiResponse> {
  const validation = sendVerificationEmailSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input",
      data: { validationErrors: validation.error.issues },
    };
  }

  try {
    const validatedData = validation.data;

    const templateName =
      validatedData.type === "password-reset"
        ? "reset-password-email"
        : "verify-email";

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    let dataField;
    if (validatedData.type === "password-reset") {
      dataField = {
        resetPasswordCode: validatedData.verificationCode,
        cta: {
          text: "Reset Password",
          url: `${baseUrl}/authentication/reset-password?token=${validatedData.verificationCode}`,
        },
      };
    } else {
      dataField = {
        verificationCode: validatedData.verificationCode,
        cta: {
          text: "Verify Email",
          url: `${baseUrl}/authentication/verify-email/${validatedData.username}?code=${validatedData.verificationCode}`,
        },
      };
    }

    const emailResponse = await sendEmails({
      templateName,
      recipients: [
        { email: validatedData.email, username: validatedData.username },
      ],
      data: dataField,
    });

    if (!emailResponse.success) {
      return {
        success: false,
        message: emailResponse.message || "Failed to send verification email",
      };
    }

    return {
      success: true,
      message: "Verification email sent successfully",
    };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while sending the email",
    };
  }
}
