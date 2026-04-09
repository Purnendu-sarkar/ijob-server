import bcrypt from 'bcryptjs';
import { Prisma, UserRole, UserStatus } from "../../../prisma/generated/client/client";
import { prisma } from "../../../lib/prisma";
import config from "../../../config";
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { IModeratorFilterRequest } from './moderator.interface';

const createModerator = async (payload: any) => {
    const { password, moderator, profilePhotoUrl } = payload;

    const hashedPassword = await bcrypt.hash(password, Number(config.salt_rounds));

    return prisma.$transaction(
        async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: moderator.email,
                    phone: moderator.phone || null,
                    passwordHash: hashedPassword,
                    role: UserRole.MODERATOR,
                    fullName: moderator.name,
                    profilePhotoUrl: profilePhotoUrl || null,
                    needPasswordChange: false,
                    status: UserStatus.ACTIVE,
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
        },
        { maxWait: 20000, timeout: 30000 }
    );
};

const getAllFromDB = async (params: IModeratorFilterRequest, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.ModeratorProfileWhereInput[] = [];

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
        const filterConditions: Prisma.ModeratorProfileWhereInput[] = [];

        if (filterData.fullName) filterConditions.push({ user: { fullName: { equals: filterData.fullName, mode: 'insensitive' } } });
        if (filterData.email) filterConditions.push({ user: { email: { equals: filterData.email, mode: 'insensitive' } } });
        if (filterData.phone) filterConditions.push({ user: { phone: { equals: filterData.phone } } });
        if (filterData.assignedRegions) {
            const regions =
                typeof filterData.assignedRegions === "string"
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
        user: { status: { not: UserStatus.DELETED } },
    });

    const whereConditions: Prisma.ModeratorProfileWhereInput = { AND: andConditions };

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

    let orderBy: Prisma.ModeratorProfileOrderByWithRelationInput = {
        createdAt: 'desc',
    };

    if (options.sortBy && options.sortOrder) {
        if (options.sortBy === "name") {
            orderBy = {
                user: {
                    fullName: options.sortOrder as Prisma.SortOrder,
                },
            };
        } else if (options.sortBy === "email") {
            orderBy = {
                user: {
                    email: options.sortOrder as Prisma.SortOrder,
                },
            };
        } else {
            orderBy = {
                [options.sortBy]: options.sortOrder as Prisma.SortOrder,
            };
        }
    }

    const result = await prisma.moderatorProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy,
        //: options.sortBy ? { [options.sortBy]: options.sortOrder as Prisma.SortOrder } : { createdAt: 'desc' },
        select,
    });

    const total = await prisma.moderatorProfile.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: result,
    };
};

const getByIdFromDB = async (id: string) => {
    const result = await prisma.moderatorProfile.findUnique({
        where: {
            id,
            user: {
                status: { not: UserStatus.DELETED }
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

const updateIntoDB = async (id: string, payload: any) => {
    await prisma.moderatorProfile.findFirstOrThrow({
        where: { id, user: { status: { not: UserStatus.DELETED } } },
    });

    const updateData: Prisma.ModeratorProfileUpdateInput = {
        bio: payload.bio,
        assignedRegions: payload.assignedRegions,
        user: {
            update: {
                ...(payload.name && { fullName: payload.name }),
                ...(payload.phone && { phone: payload.phone }),
            },
        },
    };

    return prisma.moderatorProfile.update({
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



export const ModeratorService = {
    createModerator,
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
};