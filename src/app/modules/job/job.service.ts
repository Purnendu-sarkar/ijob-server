import slugify from "slugify";
import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interfaces/pagination";
import ApiError from "../../errors/ApiError";
import {
  JobStatus,
  Prisma,
  UserRole,
  UserStatus,
  VerificationStatus,
} from "../../../prisma/generated/client/client";
import { jobSortableFields } from "./job.constant";

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

type JobFilterRequest = {
  id?: string;
  companyId?: string;
  companyName?: string;
  employmentType?: string;
  workplaceType?: string;
  experienceMin?: string | number;
  experienceMax?: string | number;
  salaryMin?: string | number;
  salaryMax?: string | number;
  postedWithin?: string | number;
};

const parseNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const publicJobSelect = {
  id: true,
  companyId: true,
  title: true,
  slug: true,
  description: true,
  employmentType: true,
  workplaceType: true,
  experienceMin: true,
  experienceMax: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  vacancies: true,
  applicationDeadline: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      verificationStatus: true,
    },
  },
};

const buildJobOrderBy = (options: IPaginationOptions): Prisma.JobOrderByWithRelationInput => {
  const sortBy = options.sortBy || "publishedAt";
  const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

  if (!jobSortableFields.includes(sortBy)) {
    return { publishedAt: "desc" };
  }

  return { [sortBy]: sortOrder };
};

const getAllFromDB = async (
  params: JobFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const andConditions: Prisma.JobWhereInput[] = [
    {
      status: JobStatus.PUBLISHED,
      company: {
        verificationStatus: VerificationStatus.VERIFIED,
      },
    },
  ];

  const id = typeof params.id === "string" ? params.id.trim() : "";
  if (id) {
    andConditions.push({
      OR: [
        { title: { contains: id, mode: "insensitive" } },
        { description: { contains: id, mode: "insensitive" } },
        { company: { name: { contains: id, mode: "insensitive" } } },
      ],
    });
  }

  if (typeof params.companyId === "string" && params.companyId.trim()) {
    andConditions.push({ companyId: params.companyId.trim() });
  }

  if (typeof params.companyName === "string" && params.companyName.trim()) {
    andConditions.push({
      company: {
        name: { contains: params.companyName.trim(), mode: "insensitive" },
      },
    });
  }

  if (typeof params.employmentType === "string" && params.employmentType.trim()) {
    andConditions.push({
      employmentType: { equals: params.employmentType.trim(), mode: "insensitive" },
    });
  }

  if (typeof params.workplaceType === "string" && params.workplaceType.trim()) {
    andConditions.push({
      workplaceType: { equals: params.workplaceType.trim(), mode: "insensitive" },
    });
  }

  const experienceMin = parseNumber(params.experienceMin);
  const experienceMax = parseNumber(params.experienceMax);
  const salaryMin = parseNumber(params.salaryMin);
  const salaryMax = parseNumber(params.salaryMax);
  const postedWithin = parseNumber(params.postedWithin);

  if (typeof experienceMin === "number") {
    andConditions.push({
      OR: [{ experienceMax: { gte: experienceMin } }, { experienceMax: null }],
    });
  }

  if (typeof experienceMax === "number") {
    andConditions.push({
      OR: [{ experienceMin: { lte: experienceMax } }, { experienceMin: null }],
    });
  }

  if (typeof salaryMin === "number") {
    andConditions.push({
      OR: [{ salaryMax: { gte: salaryMin } }, { salaryMax: null }],
    });
  }

  if (typeof salaryMax === "number") {
    andConditions.push({
      OR: [{ salaryMin: { lte: salaryMax } }, { salaryMin: null }],
    });
  }

  if (typeof postedWithin === "number" && postedWithin > 0) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - postedWithin);
    andConditions.push({ publishedAt: { gte: fromDate } });
  }

  const whereConditions: Prisma.JobWhereInput = { AND: andConditions };

  const jobs = await prisma.job.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: buildJobOrderBy(options),
    select: publicJobSelect,
  });

  const total = await prisma.job.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: jobs,
  };
};

export const JobService = {
  createJobIntoDB,
  getAllFromDB,
};
