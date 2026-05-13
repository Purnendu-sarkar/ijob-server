"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employerValidationSchemas = void 0;
const zod_1 = require("zod");
const emptyToUndefined = (value) => {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};
const optionalText = (max = 1000) => zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().max(max).optional());
const optionalUrl = zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().url("Invalid company website").optional());
const optionalPhone = zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().regex(/^(?:\+?88)?01[3-9]\d{8}$/).optional());
const employerCompanyBody = zod_1.z.object({
    name: optionalText(100),
    phone: optionalPhone,
    designation: optionalText(120),
    companyName: optionalText(150),
    companyDescription: optionalText(2000),
    companyWebsite: optionalUrl,
    companyAddress: optionalText(300),
    companyIndustry: optionalText(100),
    companySize: optionalText(50),
    tradeLicenseNumber: optionalText(100),
});
const updateEmployerProfile = zod_1.z.object({
    body: employerCompanyBody.extend({
        companyVerificationStatus: zod_1.z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
        verificationRejectionReason: optionalText(500),
    }),
});
const updateMyCompanyProfile = zod_1.z.object({
    body: employerCompanyBody,
});
const submitVerificationDocuments = zod_1.z.object({
    body: zod_1.z.object({}).passthrough(),
});
exports.employerValidationSchemas = {
    updateEmployerProfile,
    updateMyCompanyProfile,
    submitVerificationDocuments,
};
