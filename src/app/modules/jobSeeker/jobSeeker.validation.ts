import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const textArraySchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}, z.array(z.string()).optional());

const optionalText = (max = 2000) =>
  z.preprocess(emptyToUndefined, z.string().max(max).optional());

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional(),
);

const updateJobSeekerProfileBody = z.object({
  fullName: optionalText(100),
  dateOfBirth: z.preprocess(emptyToUndefined, z.string().optional()),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
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

const updateJobSeekerProfile = z.object({
  body: updateJobSeekerProfileBody.extend({
    isProfileVerified: z.boolean().optional(),
  }),
});

const updateMyJobSeekerProfile = z.object({
  body: updateJobSeekerProfileBody,
});

export const jobSeekerValidationSchemas = {
  updateJobSeekerProfile,
  updateMyJobSeekerProfile,
};
