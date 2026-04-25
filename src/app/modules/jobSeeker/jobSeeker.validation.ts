import { z } from "zod";


const updateJobSeekerProfile = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    currentLocationId: z.string().optional(),
    expectedSalaryMin: z.number().int().optional(),
    expectedSalaryMax: z.number().int().optional(),
    experienceYears: z.number().int().min(0).optional(),
    about: z.string().max(1000).optional(),
    preferredJobTypes: z.array(z.string()).optional(),
    preferredLocations: z.array(z.string()).optional(),
    isProfileVerified: z.boolean().optional(),
  }),
});

export const jobSeekerValidationSchemas = {
  updateJobSeekerProfile,
};