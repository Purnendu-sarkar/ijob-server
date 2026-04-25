"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSeekerValidationSchemas = void 0;
const zod_1 = require("zod");
const updateJobSeekerProfile = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(100).optional(),
        dateOfBirth: zod_1.z.string().datetime().optional(),
        gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        currentLocationId: zod_1.z.string().optional(),
        expectedSalaryMin: zod_1.z.number().int().optional(),
        expectedSalaryMax: zod_1.z.number().int().optional(),
        experienceYears: zod_1.z.number().int().min(0).optional(),
        about: zod_1.z.string().max(1000).optional(),
        preferredJobTypes: zod_1.z.array(zod_1.z.string()).optional(),
        preferredLocations: zod_1.z.array(zod_1.z.string()).optional(),
        isProfileVerified: zod_1.z.boolean().optional(),
    }),
});
exports.jobSeekerValidationSchemas = {
    updateJobSeekerProfile,
};
