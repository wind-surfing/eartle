import { z } from "zod";

export const verifySchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9]{6}$/i, {
    message: "Verification code must be 6 letters or digits",
  }),
});
