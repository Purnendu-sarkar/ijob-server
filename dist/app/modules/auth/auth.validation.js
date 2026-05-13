"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
const verificationChannelSchema = zod_1.z.enum(["EMAIL", "SMS", "WHATSAPP"]);
const identifierSchema = zod_1.z
    .string()
    .trim()
    .min(5, { message: "Email or phone number is required" })
    .max(100, { message: "Identifier is too long" });
const verificationCodeSchema = zod_1.z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Verification code must be 6 digits" });
const requestContactVerification = zod_1.z.object({
    body: zod_1.z.object({
        identifier: identifierSchema,
        channel: verificationChannelSchema.optional(),
    }),
});
const confirmContactVerification = zod_1.z.object({
    body: zod_1.z.object({
        identifier: identifierSchema,
        code: verificationCodeSchema,
        channel: verificationChannelSchema.optional(),
    }),
});
exports.authValidation = {
    requestContactVerification,
    confirmContactVerification,
};
