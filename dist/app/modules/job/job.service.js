"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = require("../../../lib/prisma");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const client_1 = require("../../../prisma/generated/client/client");
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
const getAllFromDB = async () => {
    const jobs = await prisma_1.prisma.job.findMany({
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
exports.JobService = {
    createJobIntoDB,
    getAllFromDB,
};
