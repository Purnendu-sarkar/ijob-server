"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSeekerValidationSchemas = void 0;
const zod_1 = require("zod");
const emptyToUndefined = (value) => {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};
const textArraySchema = zod_1.z.preprocess((value) => {
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value;
}, zod_1.z.array(zod_1.z.string()).optional());
const optionalText = (max = 2000) => zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().max(max).optional());
const optionalInt = zod_1.z.preprocess(emptyToUndefined, zod_1.z.coerce.number().int().min(0).optional());
const updateJobSeekerProfileBody = zod_1.z.object({
    fullName: optionalText(100),
    dateOfBirth: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().optional()),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    currentLocationId: optionalText(120),
    expectedSalaryMin: optionalInt,
    expectedSalaryMax: optionalInt,
    experienceYears: optionalInt,
    about: optionalText(2000),
    education: optionalText(1000),
    skills: textArraySchema,
    preferredJobTypes: textArraySchema,
    preferredLocations: textArraySchema,
    resumeUrl: optionalText(500),
    videoIntroUrl: optionalText(500),
});
const updateJobSeekerProfile = zod_1.z.object({
    body: updateJobSeekerProfileBody.extend({
        isProfileVerified: zod_1.z.boolean().optional(),
    }),
});
const updateMyJobSeekerProfile = zod_1.z.object({
    body: updateJobSeekerProfileBody,
});
exports.jobSeekerValidationSchemas = {
    updateJobSeekerProfile,
    updateMyJobSeekerProfile,
};
