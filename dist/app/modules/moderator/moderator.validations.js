"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderatorValidationSchemas = void 0;
const zod_1 = require("zod");
const createModerator = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string().min(6, "Password must be at least 6 characters").max(128),
        moderator: zod_1.z.object({
            name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(100),
            email: zod_1.z.string().email("Invalid email format").min(5).max(100),
            phone: zod_1.z
                .string()
                .regex(/^(01[3-9]\d{8})$/, "Invalid Bangladeshi phone number (01XXXXXXXXX)")
                .optional(),
            bio: zod_1.z.string().max(500).optional(),
            assignedRegions: zod_1.z.array(zod_1.z.string()).optional().default([]),
        }),
    }),
});
const updateModerator = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100).optional(),
        phone: zod_1.z.string().regex(/^(01[3-9]\d{8})$/).optional(),
        bio: zod_1.z.string().max(500).optional(),
        assignedRegions: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.moderatorValidationSchemas = {
    createModerator,
    updateModerator,
};
