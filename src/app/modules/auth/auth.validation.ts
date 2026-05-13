import { z } from "zod";

const verificationChannelSchema = z.enum(["EMAIL", "SMS", "WHATSAPP"]);

const identifierSchema = z
  .string()
  .trim()
  .min(5, { message: "Email or phone number is required" })
  .max(100, { message: "Identifier is too long" });

const verificationCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "Verification code must be 6 digits" });

const requestContactVerification = z.object({
  body: z.object({
    identifier: identifierSchema,
    channel: verificationChannelSchema.optional(),
  }),
});

const confirmContactVerification = z.object({
  body: z.object({
    identifier: identifierSchema,
    code: verificationCodeSchema,
    channel: verificationChannelSchema.optional(),
  }),
});

export const authValidation = {
  requestContactVerification,
  confirmContactVerification,
};
