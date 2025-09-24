import { z } from "zod";
import { UserProfileUpdate } from "@/types/User";

export const userProfileUpdateSchema = z.object({
  username: z
    .string()
    .min(2, "User name must be at least 2 characters")
    .max(20, "User name must be no more than 20 characters")
    .regex(
      /^[a-z0-9_]+$/i,
      "Only letters, numbers, and underscores are allowed"
    ),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters"),
  bio: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val: string | undefined) => (val === "" ? null : val)),
  avatar: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val: string | undefined) => (val === "" ? null : val)),
  theme: z.string(),
  skills: z.array(z.string()).optional().default([]),
  preferences: z.array(z.string()).optional().default([]),
});

export type { UserProfileUpdate };
