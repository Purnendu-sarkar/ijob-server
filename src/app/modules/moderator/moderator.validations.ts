import { z } from "zod";

const createModerator = z.object({
    body: z.object({
        password: z.string().min(6, "Password must be at least 6 characters").max(128),
        moderator: z.object({
            name: z.string().min(2, "Name must be at least 2 characters").max(100),
            email: z.string().email("Invalid email format").min(5).max(100),
            phone: z
                .string()
                .regex(/^(01[3-9]\d{8})$/, "Invalid Bangladeshi phone number (01XXXXXXXXX)")
                .optional(),
            bio: z.string().max(500).optional(),
            assignedRegions: z.array(z.string()).optional().default([]),
        }),
    }),
});

export const moderatorValidationSchemas = {
    createModerator,
};