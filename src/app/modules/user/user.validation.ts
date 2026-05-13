import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(128, { message: "Password is too long" });

const emailSchema = z.preprocess(
  emptyToUndefined,
  z.string().email({ message: "Invalid email format" }).min(5).max(100).optional(),
);

const phoneSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^(?:\+?88)?01[3-9]\d{8}$/, {
      message: "Invalid Bangladeshi phone number (01XXXXXXXXX)",
    })
    .optional(),
);

const fullNameSchema = z.string().min(2).max(100);

const optionalText = (max = 2000) =>
  z.preprocess(emptyToUndefined, z.string().max(max).optional());

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional(),
);

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive().optional(),
);

const textArraySchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}, z.array(z.string().min(1)).optional().default([]));

const jobTypesSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return value;
  },
  z
    .array(
      z.enum([
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
      ]),
    )
    .optional()
    .default([]),
);

const contactRefinement = (data: { email?: string; phone?: string }) =>
  Boolean(data.email || data.phone);

export const createAdminValidationSchema = z.object({
  body: z.object({
    password: passwordSchema,
    admin: z.object({
      name: fullNameSchema,
      email: z.string().email({ message: "Invalid email format" }).min(5).max(100),
      phone: phoneSchema,
      department: optionalText(100),
    }),
  }),
});

export const createJobSeekerValidationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      phone: phoneSchema,
      password: passwordSchema,
      fullName: fullNameSchema,
      dateOfBirth: z.preprocess(
        emptyToUndefined,
        z.string().date({ message: "Invalid date format. Use YYYY-MM-DD" }).optional(),
      ),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
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
    .refine(
      (data) => {
        if (data.expectedSalaryMin && data.expectedSalaryMax) {
          return data.expectedSalaryMax >= data.expectedSalaryMin;
        }
        return true;
      },
      {
        message: "Max expected salary must be >= min expected salary",
        path: ["expectedSalaryMax"],
      },
    ),
});

export const createEmployerValidationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      phone: phoneSchema,
      password: passwordSchema,
      fullName: fullNameSchema,
      companyName: z.string().min(2).max(150),
      companyWebsite: z.preprocess(
        emptyToUndefined,
        z.string().url({ message: "Invalid company website URL" }).optional(),
      ),
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

export const userValidation = {
  createJobSeeker: createJobSeekerValidationSchema,
  createEmployer: createEmployerValidationSchema,
  createAdmin: createAdminValidationSchema,
};
