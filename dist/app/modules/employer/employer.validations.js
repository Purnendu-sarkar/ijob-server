"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employerValidationSchemas = void 0;
const zod_1 = require("zod");
const updateEmployerProfile = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100).optional(),
        phone: zod_1.z.string().regex(/^(01[3-9]\d{8})$/).optional(),
        designation: zod_1.z.string().min(2).max(120).optional(),
        companyName: zod_1.z.string().min(2).max(150).optional(),
        companyDescription: zod_1.z.string().max(1000).optional(),
        companyWebsite: zod_1.z.string().url("Invalid company website").optional(),
        companyAddress: zod_1.z.string().max(255).optional(),
        companyVerificationStatus: zod_1.z
            .enum(["PENDING", "VERIFIED", "REJECTED"])
            .optional(),
    }),
});
exports.employerValidationSchemas = {
    updateEmployerProfile,
};
