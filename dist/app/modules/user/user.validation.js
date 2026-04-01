"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidation = exports.createEmployerValidationSchema = exports.createJobSeekerValidationSchema = void 0;
const zod_1 = require("zod");
// ── Common parts ───────────────────────────────────────
const passwordSchema = zod_1.z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password is too long" });
const emailSchema = zod_1.z
    .string()
    .email({ message: "Invalid email format" })
    .min(5)
    .max(100);
const phoneSchema = zod_1.z
    .string()
    .regex(/^(01[3-9]\d{8})$/, { message: "Invalid Bangladeshi phone number (01XXXXXXXXX)" })
    .optional();
const fullNameSchema = zod_1.z.string().min(2).max(100).optional();
// ── Job Seeker ─────────────────────────────────────────
exports.createJobSeekerValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
        phone: phoneSchema,
        password: passwordSchema,
        fullName: fullNameSchema,
        // JobSeekerProfile fields
        dateOfBirth: zod_1.z
            .string()
            .date({ message: "Invalid date format. Use YYYY-MM-DD (e.g. 1998-05-20)" })
            .transform((val) => val ? new Date(val) : null)
            .optional(),
        gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        currentLocationId: zod_1.z.string().uuid().optional(),
        expectedSalaryMin: zod_1.z.number().int().positive().optional(),
        expectedSalaryMax: zod_1.z.number().int().positive().optional(),
        experienceYears: zod_1.z.number().int().min(0).optional(),
        about: zod_1.z.string().max(2000).optional(),
        // Arrays
        preferredJobTypes: zod_1.z
            .array(zod_1.z.enum([
            "FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP",
            "FREELANCE", "REMOTE", "GOVT", "NGO", "PRIVATE", "HYBRID"
        ]))
            .optional()
            .default([]),
        preferredLocations: zod_1.z.array(zod_1.z.string()).optional().default([]),
    }).refine((data) => {
        if (data.expectedSalaryMin && data.expectedSalaryMax) {
            return data.expectedSalaryMax >= data.expectedSalaryMin;
        }
        return true;
    }, {
        message: "Max expected salary must be >= min expected salary",
        path: ["expectedSalaryMax"],
    }),
});
// ── Employer ──────────────────────────────────────────
exports.createEmployerValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
        phone: phoneSchema,
        password: passwordSchema,
        fullName: fullNameSchema,
        // Company fields (required for first-time employer)
        companyName: zod_1.z.string().min(2).max(150),
        companyWebsite: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
        companyDescription: zod_1.z.string().max(2000).optional(),
        designation: zod_1.z.string().max(100).optional(),
    }),
});
// Export for controller / middleware
exports.userValidation = {
    createJobSeeker: exports.createJobSeekerValidationSchema,
    createEmployer: exports.createEmployerValidationSchema,
};
