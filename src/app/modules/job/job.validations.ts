import { z } from "zod";

const createJob = z.object({
  body: z
    .object({
      title: z.string().min(2).max(200),
      description: z.string().min(10).max(20000),
      employmentType: z.string().min(2).max(60),
      workplaceType: z.string().min(2).max(60),
      experienceMin: z.number().int().min(0).optional(),
      experienceMax: z.number().int().min(0).optional(),
      salaryMin: z.number().min(0).optional(),
      salaryMax: z.number().min(0).optional(),
      currency: z.string().min(2).max(10).optional(),
      vacancies: z.number().int().min(1).optional(),
      applicationDeadline: z.string().optional(),
    })
    .refine(
      (data) => {
        if (
          typeof data.experienceMin === "number" &&
          typeof data.experienceMax === "number"
        ) {
          return data.experienceMax >= data.experienceMin;
        }
        return true;
      },
      { message: "experienceMax must be >= experienceMin", path: ["experienceMax"] },
    )
    .refine(
      (data) => {
        if (typeof data.salaryMin === "number" && typeof data.salaryMax === "number") {
          return data.salaryMax >= data.salaryMin;
        }
        return true;
      },
      { message: "salaryMax must be >= salaryMin", path: ["salaryMax"] },
    ),
});

export const jobValidationSchemas = {
  createJob,
};

