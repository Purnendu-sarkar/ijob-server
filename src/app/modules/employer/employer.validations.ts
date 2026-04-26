import { z } from "zod";

const updateEmployerProfile = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^(01[3-9]\d{8})$/).optional(),
    designation: z.string().min(2).max(120).optional(),
    companyName: z.string().min(2).max(150).optional(),
    companyDescription: z.string().max(1000).optional(),
    companyWebsite: z.string().url("Invalid company website").optional(),
    companyAddress: z.string().max(255).optional(),
    companyVerificationStatus: z
      .enum(["PENDING", "VERIFIED", "REJECTED"])
      .optional(),
  }),
});

export const employerValidationSchemas = {
  updateEmployerProfile,
};

