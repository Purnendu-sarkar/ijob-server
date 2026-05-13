"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSeekerService = void 0;
const prisma_1 = require("../../../lib/prisma");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const enums_1 = require("../../../prisma/generated/client/enums");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const normalizeTextArray = (value, fallback = []) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return fallback;
};
const calculateProfileCompletion = (profile) => {
    const checks = [
        profile.fullName,
        profile.user?.email || profile.user?.phone,
        profile.skills?.length,
        profile.experienceYears !== undefined && profile.experienceYears !== null,
        profile.education,
        profile.currentLocationId,
        profile.preferredJobTypes?.length,
        profile.preferredLocations?.length,
        profile.resumeUrl,
        profile.about,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
const getAllFromDB = async (params, options) => {
    const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            OR: [
                { fullName: { contains: searchTerm, mode: 'insensitive' } },
                { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
                { user: { phone: { contains: searchTerm, mode: 'insensitive' } } },
                { about: { contains: searchTerm, mode: 'insensitive' } },
            ],
        });
    }
    // Additional filters
    if (filterData.gender) {
        andConditions.push({ gender: filterData.gender });
    }
    if (filterData.experienceYears) {
        andConditions.push({
            experienceYears: Number(filterData.experienceYears),
        });
    }
    if (filterData.email) {
        andConditions.push({
            user: {
                email: {
                    contains: filterData.email,
                    mode: 'insensitive',
                },
            },
        });
    }
    if (filterData.phone) {
        andConditions.push({
            user: {
                phone: {
                    contains: filterData.phone,
                    mode: 'insensitive',
                },
            },
        });
    }
    if (filterData.isProfileVerified === 'true' ||
        filterData.isProfileVerified === 'false') {
        andConditions.push({
            isProfileVerified: filterData.isProfileVerified === 'true',
        });
    }
    andConditions.push({
        user: { status: { not: enums_1.UserStatus.DELETED } },
    });
    const whereConditions = { AND: andConditions };
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = (options.sortOrder || "desc");
    const orderBy = sortBy === "name"
        ? { fullName: sortOrder }
        : sortBy === "email"
            ? { user: { email: sortOrder } }
            : sortBy === "phone"
                ? { user: { phone: sortOrder } }
                : { [sortBy]: sortOrder };
    const result = await prisma_1.prisma.jobSeekerProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    fullName: true,
                    profilePhotoUrl: true,
                    role: true,
                    status: true,
                    needPasswordChange: true,
                    lastLoginAt: true,
                },
            },
        },
    });
    const total = await prisma_1.prisma.jobSeekerProfile.count({ where: whereConditions });
    return {
        meta: { page, limit, total },
        data: result,
    };
};
const getByIdFromDB = async (id) => {
    const result = await prisma_1.prisma.jobSeekerProfile.findUnique({
        where: { id, user: { status: { not: enums_1.UserStatus.DELETED } } },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    fullName: true,
                    profilePhotoUrl: true,
                    role: true,
                    status: true,
                    needPasswordChange: true,
                    lastLoginAt: true,
                },
            },
        },
    });
    if (!result)
        throw new Error("Job Seeker not found or deleted");
    return result;
};
const updateIntoDB = async (id, payload) => {
    const existingProfile = await prisma_1.prisma.jobSeekerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: enums_1.UserStatus.DELETED } } },
        include: {
            user: true,
        },
    });
    if (payload.isProfileVerified === true &&
        !existingProfile.user.emailVerifiedAt &&
        !existingProfile.user.phoneVerifiedAt) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "A job seeker must verify email or phone before profile verification.");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updatedProfile = await tx.jobSeekerProfile.update({
            where: { id },
            data: {
                fullName: payload.fullName,
                dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
                gender: payload.gender,
                currentLocationId: payload.currentLocationId,
                expectedSalaryMin: payload.expectedSalaryMin,
                expectedSalaryMax: payload.expectedSalaryMax,
                experienceYears: payload.experienceYears,
                about: payload.about,
                education: payload.education,
                skills: payload.skills,
                resumeUrl: payload.resumeUrl,
                videoIntroUrl: payload.videoIntroUrl,
                preferredJobTypes: payload.preferredJobTypes,
                preferredLocations: payload.preferredLocations,
                isProfileVerified: payload.isProfileVerified,
            },
            include: {
                user: true,
            },
        });
        if (typeof payload.fullName === "string" && payload.fullName.trim()) {
            await tx.user.update({
                where: { id: existingProfile.userId },
                data: { fullName: payload.fullName.trim() },
            });
        }
        return updatedProfile;
    });
};
const updateMyProfile = async (userId, payload) => {
    const existingProfile = await prisma_1.prisma.jobSeekerProfile.findUniqueOrThrow({
        where: { userId },
        include: { user: true },
    });
    const skills = normalizeTextArray(payload.skills, existingProfile.skills);
    const preferredLocations = normalizeTextArray(payload.preferredLocations, existingProfile.preferredLocations);
    const preferredJobTypes = normalizeTextArray(payload.preferredJobTypes, existingProfile.preferredJobTypes);
    return prisma_1.prisma.$transaction(async (tx) => {
        if (payload.fullName || payload.profilePhotoUrl) {
            await tx.user.update({
                where: { id: userId },
                data: {
                    ...(payload.fullName ? { fullName: payload.fullName.trim() } : {}),
                    ...(payload.profilePhotoUrl ? { profilePhotoUrl: payload.profilePhotoUrl } : {}),
                },
            });
        }
        const nextProfile = {
            ...existingProfile,
            ...payload,
            skills,
            preferredLocations,
            preferredJobTypes,
            user: existingProfile.user,
        };
        return tx.jobSeekerProfile.update({
            where: { userId },
            data: {
                fullName: payload.fullName?.trim(),
                dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
                gender: payload.gender,
                currentLocationId: payload.currentLocationId,
                expectedSalaryMin: payload.expectedSalaryMin,
                expectedSalaryMax: payload.expectedSalaryMax,
                experienceYears: payload.experienceYears,
                about: payload.about,
                education: payload.education,
                skills,
                resumeUrl: payload.resumeUrl,
                videoIntroUrl: payload.videoIntroUrl,
                preferredJobTypes: preferredJobTypes,
                preferredLocations,
                profileCompletion: calculateProfileCompletion(nextProfile),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        fullName: true,
                        profilePhotoUrl: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
    });
};
const softDeleteFromDB = async (id) => {
    const profile = await prisma_1.prisma.jobSeekerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: enums_1.UserStatus.DELETED } } },
    });
    await prisma_1.prisma.user.update({
        where: { id: profile.userId },
        data: { status: enums_1.UserStatus.DELETED },
    });
    return { message: "Job Seeker soft deleted successfully", id };
};
const hardDeleteFromDB = async (id) => {
    const profile = await prisma_1.prisma.jobSeekerProfile.findUniqueOrThrow({ where: { id } });
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.jobSeekerProfile.delete({ where: { id } }),
        prisma_1.prisma.user.delete({ where: { id: profile.userId } }),
        // Add more deletes if you have resumes, skills, etc. later
    ]);
    return { message: "Job Seeker permanently deleted", id };
};
exports.JobSeekerService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    updateMyProfile,
    softDeleteFromDB,
    hardDeleteFromDB,
};
