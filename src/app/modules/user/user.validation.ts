import { z } from 'zod';

// ── Common parts ───────────────────────────────────────
const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(128, { message: "Password is too long" });

const emailSchema = z
  .string()
  .email({ message: "Invalid email format" })
  .min(5)
  .max(100);

const phoneSchema = z
  .string()
  .regex(/^(01[3-9]\d{8})$/, { message: "Invalid Bangladeshi phone number (01XXXXXXXXX)" })
  .optional();

const fullNameSchema = z.string().min(2).max(100).optional();

// ── Job Seeker ─────────────────────────────────────────
export const createJobSeekerValidationSchema = z.object({
  body: z.object({
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    fullName: fullNameSchema,

    // JobSeekerProfile fields
    dateOfBirth: z
      .string()
      .date({ message: "Invalid date format. Use YYYY-MM-DD (e.g. 1998-05-20)" })
      .transform((val) => val ? new Date(val) : null)
      .optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    currentLocationId: z.string().uuid().optional(),
    expectedSalaryMin: z.number().int().positive().optional(),
    expectedSalaryMax: z.number().int().positive().optional(),
    experienceYears: z.number().int().min(0).optional(),
    about: z.string().max(2000).optional(),

    // Arrays
    preferredJobTypes: z
      .array(z.enum([
        "FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP",
        "FREELANCE", "REMOTE", "GOVT", "NGO", "PRIVATE", "HYBRID"
      ]))
      .optional()
      .default([]),

    preferredLocations: z.array(z.string()).optional().default([]),
  }).refine(
    (data) => {
      if (data.expectedSalaryMin && data.expectedSalaryMax) {
        return data.expectedSalaryMax >= data.expectedSalaryMin;
      }
      return true;
    },
    {
      message: "Max expected salary must be >= min expected salary",
      path: ["expectedSalaryMax"],
    }
  ),
});

// Export for controller / middleware
export const userValidation = {
  createJobSeeker: createJobSeekerValidationSchema,
};

