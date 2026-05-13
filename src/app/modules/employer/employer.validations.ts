import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const optionalText = (max = 1000) =>
  z.preprocess(emptyToUndefined, z.string().max(max).optional());

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url("Invalid company website").optional(),
);

const optionalPhone = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^(?:\+?88)?01[3-9]\d{8}$/).optional(),
);

const employerCompanyBody = z.object({
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

const updateEmployerProfile = z.object({
  body: employerCompanyBody.extend({
    companyVerificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
    verificationRejectionReason: optionalText(500),
  }),
});

const updateMyCompanyProfile = z.object({
  body: employerCompanyBody,
});

const submitVerificationDocuments = z.object({
  body: z.object({}).passthrough(),
});

export const employerValidationSchemas = {
  updateEmployerProfile,
  updateMyCompanyProfile,
  submitVerificationDocuments,
};
