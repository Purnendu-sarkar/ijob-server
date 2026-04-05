import { Prisma, UserStatus } from "../../../prisma/generated/client/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { prisma } from "../../../lib/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IAdminFilterRequest } from "./admin.interface";

const getAllFromDB = async (params: IAdminFilterRequest, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.AdminProfileWhereInput[] = [];

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
        const filterConditions: Prisma.AdminProfileWhereInput[] = [];

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
        user: { status: { not: UserStatus.DELETED } },
    });

    const whereConditions: Prisma.AdminProfileWhereInput = { AND: andConditions };

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

    const result = await prisma.adminProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder as Prisma.SortOrder }
            : { createdAt: 'desc' },
        select,
    });

    const total = await prisma.adminProfile.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: result,
    };
};

const getByIdFromDB = async (id: string) => {
    const result = await prisma.adminProfile.findUnique({
        where: {
            id,
            user: { status: { not: UserStatus.DELETED } },
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

const updateIntoDB = async (id: string, payload: { name?: string; phone?: string }) => {
    // Existence check
    await prisma.adminProfile.findFirstOrThrow({
        where: { id, user: { status: { not: UserStatus.DELETED } } },
    });

    const updateData: Prisma.AdminProfileUpdateInput = {};

    // Update User table (fullName & phone)
    if (payload.name || payload.phone) {
        updateData.user = {
            update: {
                ...(payload.name && { fullName: payload.name }),
                ...(payload.phone && { phone: payload.phone }),
            },
        };
    }

    const result = await prisma.adminProfile.update({
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

const softDeleteFromDB = async (id: string) => {
    const admin = await prisma.adminProfile.findFirstOrThrow({
        where: { id, user: { status: { not: UserStatus.DELETED } } },
    });

    await prisma.user.update({
        where: { id: admin.userId },
        data: { status: UserStatus.DELETED },
    });

    return { message: "Admin has been soft deleted successfully", id };
};


export const AdminService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    softDeleteFromDB,
};