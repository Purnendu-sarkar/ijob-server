"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("../../../prisma/generated/client/client");
const prisma_1 = require("../../../lib/prisma");
const config_1 = __importDefault(require("../../../config"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const createModerator = async (payload) => {
    const { password, moderator, profilePhotoUrl } = payload;
    const hashedPassword = await bcryptjs_1.default.hash(password, Number(config_1.default.salt_rounds));
    return prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: moderator.email,
                phone: moderator.phone || null,
                passwordHash: hashedPassword,
                role: client_1.UserRole.MODERATOR,
                fullName: moderator.name,
                profilePhotoUrl: profilePhotoUrl || null,
                needPasswordChange: false,
                status: client_1.UserStatus.ACTIVE,
            },
        });
        const moderatorProfile = await tx.moderatorProfile.create({
            data: {
                userId: user.id,
                bio: moderator.bio || null,
                assignedRegions: moderator.assignedRegions || [],
            },
        });
        return {
            id: moderatorProfile.id,
            userId: user.id,
            // fullName: user.fullName,
            // email: user.email,
            // phone: user.phone,
            // profilePhoto: user.profilePhotoUrl,
            bio: moderatorProfile.bio,
            assignedRegions: moderatorProfile.assignedRegions,
            createdAt: user.createdAt,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                fullName: user.fullName,
                profilePhotoUrl: user.profilePhotoUrl,
                role: user.role,
                status: user.status,
            },
        };
    }, { maxWait: 20000, timeout: 30000 });
};
const getAllFromDB = async (params, options) => {
    const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            user: {
                OR: [
                    { fullName: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                    { phone: { contains: searchTerm, mode: 'insensitive' } },
                ],
            },
        });
    }
    if (Object.keys(filterData).length > 0) {
        const filterConditions = [];
        if (filterData.fullName)
            filterConditions.push({ user: { fullName: { equals: filterData.fullName, mode: 'insensitive' } } });
        if (filterData.email)
            filterConditions.push({ user: { email: { equals: filterData.email, mode: 'insensitive' } } });
        if (filterData.phone)
            filterConditions.push({ user: { phone: { equals: filterData.phone } } });
        if (filterData.assignedRegions) {
            const regions = typeof filterData.assignedRegions === "string"
                ? filterData.assignedRegions.split(",")
                : filterData.assignedRegions;
            filterConditions.push({
                assignedRegions: {
                    hasSome: regions,
                },
            });
        }
        if (filterConditions.length > 0) {
            andConditions.push({ AND: filterConditions });
        }
    }
    andConditions.push({
        user: { status: { not: client_1.UserStatus.DELETED } },
    });
    const whereConditions = { AND: andConditions };
    const select = {
        id: true,
        userId: true,
        bio: true,
        assignedRegions: true,
        createdAt: true,
        updatedAt: true,
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
                createdAt: true,
                updatedAt: true,
            },
        },
    };
    let orderBy = {
        createdAt: 'desc',
    };
    if (options.sortBy && options.sortOrder) {
        if (options.sortBy === "name") {
            orderBy = {
                user: {
                    fullName: options.sortOrder,
                },
            };
        }
        else if (options.sortBy === "email") {
            orderBy = {
                user: {
                    email: options.sortOrder,
                },
            };
        }
        else {
            orderBy = {
                [options.sortBy]: options.sortOrder,
            };
        }
    }
    const result = await prisma_1.prisma.moderatorProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy,
        //: options.sortBy ? { [options.sortBy]: options.sortOrder as Prisma.SortOrder } : { createdAt: 'desc' },
        select,
    });
    const total = await prisma_1.prisma.moderatorProfile.count({ where: whereConditions });
    return {
        meta: { page, limit, total },
        data: result,
    };
};
const getByIdFromDB = async (id) => {
    const result = await prisma_1.prisma.moderatorProfile.findUnique({
        where: {
            id,
            user: {
                status: { not: client_1.UserStatus.DELETED }
            },
        },
        select: {
            id: true,
            userId: true,
            bio: true,
            assignedRegions: true,
            createdAt: true,
            updatedAt: true,
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
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
    if (!result) {
        throw new Error("Moderator not found or has been deleted");
    }
    return result;
};
const updateIntoDB = async (id, payload) => {
    await prisma_1.prisma.moderatorProfile.findFirstOrThrow({
        where: { id, user: { status: { not: client_1.UserStatus.DELETED } } },
    });
    const updateData = {
        bio: payload.bio,
        assignedRegions: payload.assignedRegions,
        user: {
            update: {
                ...(payload.name && { fullName: payload.name }),
                ...(payload.phone && { phone: payload.phone }),
            },
        },
    };
    return prisma_1.prisma.moderatorProfile.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            userId: true,
            bio: true,
            assignedRegions: true,
            createdAt: true,
            updatedAt: true,
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
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
};
const softDeleteFromDB = async (id) => {
    const moderator = await prisma_1.prisma.moderatorProfile.findFirstOrThrow({
        where: { id, user: { status: { not: client_1.UserStatus.DELETED } } },
    });
    await prisma_1.prisma.user.update({
        where: { id: moderator.userId },
        data: { status: client_1.UserStatus.DELETED },
    });
    return { message: "Moderator soft deleted successfully", id };
};
const deleteFromDB = async (id) => {
    const moderator = await prisma_1.prisma.moderatorProfile.findUniqueOrThrow({ where: { id } });
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.moderatorProfile.delete({ where: { id } }),
        prisma_1.prisma.user.delete({ where: { id: moderator.userId } }),
    ]);
    return { message: "Moderator permanently deleted", id };
};
exports.ModeratorService = {
    createModerator,
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    softDeleteFromDB,
    deleteFromDB
};
