"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = require("../../../lib/prisma");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const client_1 = require("../../../prisma/generated/client/client");
const job_constant_1 = require("./job.constant");
const createJobIntoDB = async (userFromRequest, payload) => {
    if (!userFromRequest?.userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Authentication required!");
    }
    if (userFromRequest.role !== client_1.UserRole.EMPLOYER) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Only employers can post jobs.");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userFromRequest.userId },
        select: { status: true },
    });
    if (!user || user.status !== client_1.UserStatus.ACTIVE) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Account not active.");
    }
    const employer = await prisma_1.prisma.employerProfile.findUnique({
        where: { userId: userFromRequest.userId },
        select: { companyId: true, company: { select: { verificationStatus: true } } },
    });
    if (!employer) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Employer profile not found.");
    }
    if (employer.company.verificationStatus !== client_1.VerificationStatus.VERIFIED) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Company is not verified yet. An Admin must verify the company before posting jobs.");
    }
    const slugBase = (0, slugify_1.default)(payload.title, { lower: true, strict: true, trim: true });
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const job = await prisma_1.prisma.job.create({
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
            status: client_1.JobStatus.PUBLISHED,
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
const parseNumber = (value) => {
    if (value === undefined || value === null || value === "")
        return undefined;
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
const buildJobOrderBy = (options) => {
    const sortBy = options.sortBy || "publishedAt";
    const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";
    if (!job_constant_1.jobSortableFields.includes(sortBy)) {
        return { publishedAt: "desc" };
    }
    return { [sortBy]: sortOrder };
};
const getAllFromDB = async (params, options) => {
    const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const andConditions = [
        {
            status: client_1.JobStatus.PUBLISHED,
            company: {
                verificationStatus: client_1.VerificationStatus.VERIFIED,
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
    const whereConditions = { AND: andConditions };
    const jobs = await prisma_1.prisma.job.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: buildJobOrderBy(options),
        select: publicJobSelect,
    });
    const total = await prisma_1.prisma.job.count({ where: whereConditions });
    return {
        meta: { page, limit, total },
        data: jobs,
    };
};
exports.JobService = {
    createJobIntoDB,
    getAllFromDB,
};
