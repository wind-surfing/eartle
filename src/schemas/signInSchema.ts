import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";

export const emailSchema = z.string().email({
  message: "Invalid email address",
});

export const identifierSchema = z
  .string()
  .min(1, { message: "Email or username is required" })
  .refine(
    (value) => {
      const emailResult = emailSchema.safeParse(value);
      if (emailResult.success) return true;

      const usernameResult = usernameValidation.safeParse(value);
      return usernameResult.success;
    },
    {
      message:
        "Please enter a valid email address or username (2-20 characters, letters, numbers, and underscores only)",
    }
  );

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be 8 characters or more" })
    .max(50, { message: "Password must be 50 characters or less" }),
});

export type SignInFormData = z.infer<typeof signInSchema>;
