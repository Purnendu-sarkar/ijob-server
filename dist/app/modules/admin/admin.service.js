"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = require("../../../prisma/generated/client/client");
const prisma_1 = require("../../../lib/prisma");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const getAllFromDB = async (params, options) => {
    const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions = [];
    // === Search Term ===
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
    // === Exact Filters ===
    if (Object.keys(filterData).length > 0) {
        const filterConditions = [];
        if (filterData.fullName) {
            filterConditions.push({ user: { fullName: { equals: filterData.fullName, mode: 'insensitive' } } });
        }
        if (filterData.email) {
            filterConditions.push({ user: { email: { equals: filterData.email, mode: 'insensitive' } } });
        }
        if (filterData.phone) {
            filterConditions.push({ user: { phone: { equals: filterData.phone } } });
        }
        if (filterConditions.length > 0) {
            andConditions.push({ AND: filterConditions });
        }
    }
    // Exclude soft deleted
    andConditions.push({
        user: { status: { not: client_1.UserStatus.DELETED } },
    });
    const whereConditions = { AND: andConditions };
    // Optimized Select (passwordHash is excluded by default since it's not in the select)
    const select = {
        id: true,
        userId: true,
        permissions: true,
        department: true,
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
    const result = await prisma_1.prisma.adminProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: 'desc' },
        select,
    });
    const total = await prisma_1.prisma.adminProfile.count({ where: whereConditions });
    return {
        meta: { page, limit, total },
        data: result,
    };
};
const getByIdFromDB = async (id) => {
    const result = await prisma_1.prisma.adminProfile.findUnique({
        where: {
            id,
            user: { status: { not: client_1.UserStatus.DELETED } },
        },
        select: {
            id: true,
            userId: true,
            permissions: true,
            department: true,
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
    return result;
};
const updateIntoDB = async (id, payload) => {
    // Existence check
    await prisma_1.prisma.adminProfile.findFirstOrThrow({
        where: { id, user: { status: { not: client_1.UserStatus.DELETED } } },
    });
    const updateData = {};
    // Update User table (fullName & phone)
    if (payload.name || payload.phone) {
        updateData.user = {
            update: {
                ...(payload.name && { fullName: payload.name }),
                ...(payload.phone && { phone: payload.phone }),
            },
        };
    }
    const result = await prisma_1.prisma.adminProfile.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            userId: true,
            permissions: true,
            department: true,
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
    return result;
};
const softDeleteFromDB = async (id) => {
    const admin = await prisma_1.prisma.adminProfile.findFirstOrThrow({
        where: { id, user: { status: { not: client_1.UserStatus.DELETED } } },
    });
    await prisma_1.prisma.user.update({
        where: { id: admin.userId },
        data: { status: client_1.UserStatus.DELETED },
    });
    return { message: "Admin has been soft deleted successfully", id };
};
const deleteFromDB = async (id) => {
    const admin = await prisma_1.prisma.adminProfile.findUniqueOrThrow({ where: { id } });
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.adminProfile.delete({ where: { id } }),
        prisma_1.prisma.user.delete({ where: { id: admin.userId } }),
    ]);
    return { message: "Admin permanently deleted", id };
};
exports.AdminService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    softDeleteFromDB,
    deleteFromDB
};
