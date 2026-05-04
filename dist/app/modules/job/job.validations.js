"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobValidationSchemas = void 0;
const zod_1 = require("zod");
const createJob = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(2).max(200),
        description: zod_1.z.string().min(10).max(20000),
        employmentType: zod_1.z.string().min(2).max(60),
        workplaceType: zod_1.z.string().min(2).max(60),
        experienceMin: zod_1.z.number().int().min(0).optional(),
        experienceMax: zod_1.z.number().int().min(0).optional(),
        salaryMin: zod_1.z.number().min(0).optional(),
        salaryMax: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().min(2).max(10).optional(),
        vacancies: zod_1.z.number().int().min(1).optional(),
        applicationDeadline: zod_1.z.string().optional(),
    })
        .refine((data) => {
        if (typeof data.experienceMin === "number" &&
            typeof data.experienceMax === "number") {
            return data.experienceMax >= data.experienceMin;
        }
        return true;
    }, { message: "experienceMax must be >= experienceMin", path: ["experienceMax"] })
        .refine((data) => {
        if (typeof data.salaryMin === "number" && typeof data.salaryMax === "number") {
            return data.salaryMax >= data.salaryMin;
        }
        return true;
    }, { message: "salaryMax must be >= salaryMin", path: ["salaryMax"] }),
});
exports.jobValidationSchemas = {
    createJob,
};
