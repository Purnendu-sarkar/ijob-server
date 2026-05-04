import slugify from "slugify";
import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../errors/ApiError";
import {
  JobStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from "../../../prisma/generated/client/client";

const createJobIntoDB = async (
  userFromRequest: { userId: string; role: UserRole },
  payload: any,
) => {
  if (!userFromRequest?.userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required!");
  }

  if (userFromRequest.role !== UserRole.EMPLOYER) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only employers can post jobs.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userFromRequest.userId },
    select: { status: true },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "Account not active.");
  }

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: userFromRequest.userId },
    select: { companyId: true, company: { select: { verificationStatus: true } } },
  });

  if (!employer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employer profile not found.");
  }

  if (employer.company.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Company is not verified yet. An Admin must verify the company before posting jobs.",
    );
  }

  const slugBase = slugify(payload.title, { lower: true, strict: true, trim: true });
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const job = await prisma.job.create({
    data: {
      companyId: employer.companyId,
      title: payload.title,
      slug,
      description: payload.description,
      employmentType: payload.employmentType,
      workplaceType: payload.workplaceType,
      experienceMin: payload.experienceMin ?? null,
      experienceMax: payload.experienceMax ?? null,
      salaryMin: payload.salaryMin ?? null,
      salaryMax: payload.salaryMax ?? null,
      currency: payload.currency ?? "BDT",
      vacancies: payload.vacancies ?? 1,
      applicationDeadline: payload.applicationDeadline ?? null,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          verificationStatus: true,
        },
      },
    },
  });

  return job;
};

const getAllFromDB = async () => {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          verificationStatus: true,
        },
      },
    },
  });

  return jobs;
};

export const JobService = {
  createJobIntoDB,
  getAllFromDB,
};

