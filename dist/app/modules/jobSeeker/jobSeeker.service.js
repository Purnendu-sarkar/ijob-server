"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSeekerService = void 0;
const prisma_1 = require("../../../lib/prisma");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const enums_1 = require("../../../prisma/generated/client/enums");
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
    const result = await prisma_1.prisma.jobSeekerProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
    await prisma_1.prisma.jobSeekerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: enums_1.UserStatus.DELETED } } },
    });
    return prisma_1.prisma.jobSeekerProfile.update({
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
            preferredJobTypes: payload.preferredJobTypes,
            preferredLocations: payload.preferredLocations,
            isProfileVerified: payload.isProfileVerified,
        },
        include: {
            user: true,
        },
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
    softDeleteFromDB,
    hardDeleteFromDB,
};
