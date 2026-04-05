import { z } from "zod";

const update = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").optional(),
        phone: z.string().min(1, "Contact number is required").optional(),
    }),
});

export const adminValidationSchemas = { update };