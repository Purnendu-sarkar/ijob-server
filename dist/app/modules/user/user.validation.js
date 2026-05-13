"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidation = exports.createEmployerValidationSchema = exports.createJobSeekerValidationSchema = exports.createAdminValidationSchema = void 0;
const zod_1 = require("zod");
const emptyToUndefined = (value) => {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};
const passwordSchema = zod_1.z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password is too long" });
const emailSchema = zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().email({ message: "Invalid email format" }).min(5).max(100).optional());
const phoneSchema = zod_1.z.preprocess(emptyToUndefined, zod_1.z
    .string()
    .regex(/^(?:\+?88)?01[3-9]\d{8}$/, {
    message: "Invalid Bangladeshi phone number (01XXXXXXXXX)",
})
    .optional());
const fullNameSchema = zod_1.z.string().min(2).max(100);
const optionalText = (max = 2000) => zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().max(max).optional());
const optionalInt = zod_1.z.preprocess(emptyToUndefined, zod_1.z.coerce.number().int().min(0).optional());
const optionalPositiveInt = zod_1.z.preprocess(emptyToUndefined, zod_1.z.coerce.number().int().positive().optional());
const textArraySchema = zod_1.z.preprocess((value) => {
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value;
}, zod_1.z.array(zod_1.z.string().min(1)).optional().default([]));
const jobTypesSchema = zod_1.z.preprocess((value) => {
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value;
}, zod_1.z
    .array(zod_1.z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
    "FREELANCE",
    "REMOTE",
    "GOVT",
    "NGO",
    "PRIVATE",
    "HYBRID",
]))
    .optional()
    .default([]));
const contactRefinement = (data) => Boolean(data.email || data.phone);
exports.createAdminValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: passwordSchema,
        admin: zod_1.z.object({
            name: fullNameSchema,
            email: zod_1.z.string().email({ message: "Invalid email format" }).min(5).max(100),
            phone: phoneSchema,
            department: optionalText(100),
        }),
    }),
});
exports.createJobSeekerValidationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        email: emailSchema,
        phone: phoneSchema,
        password: passwordSchema,
        fullName: fullNameSchema,
        dateOfBirth: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().date({ message: "Invalid date format. Use YYYY-MM-DD" }).optional()),
        gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        currentLocationId: optionalText(120),
        expectedSalaryMin: optionalPositiveInt,
        expectedSalaryMax: optionalPositiveInt,
        experienceYears: optionalInt,
        about: optionalText(2000),
        education: optionalText(1000),
        resumeUrl: optionalText(500),
        videoIntroUrl: optionalText(500),
        skills: textArraySchema,
        preferredJobTypes: jobTypesSchema,
        preferredLocations: textArraySchema,
    })
        .refine(contactRefinement, {
        message: "Email or phone number is required",
        path: ["email"],
    })
        .refine((data) => {
        if (data.expectedSalaryMin && data.expectedSalaryMax) {
            return data.expectedSalaryMax >= data.expectedSalaryMin;
        }
        return true;
    }, {
        message: "Max expected salary must be >= min expected salary",
        path: ["expectedSalaryMax"],
    }),
});
exports.createEmployerValidationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        email: emailSchema,
        phone: phoneSchema,
        password: passwordSchema,
        fullName: fullNameSchema,
        companyName: zod_1.z.string().min(2).max(150),
        companyWebsite: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().url({ message: "Invalid company website URL" }).optional()),
        companyDescription: optionalText(2000),
        companyAddress: optionalText(300),
        companyIndustry: optionalText(100),
        companySize: optionalText(50),
        tradeLicenseNumber: optionalText(100),
        designation: optionalText(100),
    })
        .refine(contactRefinement, {
        message: "Email or phone number is required",
        path: ["email"],
    }),
});
exports.userValidation = {
    createJobSeeker: exports.createJobSeekerValidationSchema,
    createEmployer: exports.createEmployerValidationSchema,
    createAdmin: exports.createAdminValidationSchema,
};
