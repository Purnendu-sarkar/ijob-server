import { prisma } from "../../../lib/prisma";
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { IJobSeekerFilterRequest } from './jobSeeker.interface';
import { UserRole, UserStatus, Gender } from '../../../prisma/generated/client/enums';
import { Prisma } from '../../../prisma/generated/client/client';


const getAllFromDB = async (params: IJobSeekerFilterRequest, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.JobSeekerProfileWhereInput[] = [];

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
        andConditions.push({ gender: filterData.gender as Gender });
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

    if (
        filterData.isProfileVerified === 'true' ||
        filterData.isProfileVerified === 'false'
    ) {
        andConditions.push({
            isProfileVerified: filterData.isProfileVerified === 'true',
        });
    }

    andConditions.push({
        user: { status: { not: UserStatus.DELETED } },
    });

    const whereConditions: Prisma.JobSeekerProfileWhereInput = { AND: andConditions };

    const result = await prisma.jobSeekerProfile.findMany({
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

    const total = await prisma.jobSeekerProfile.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: result,
    };
};

const getByIdFromDB = async (id: string) => {
    const result = await prisma.jobSeekerProfile.findUnique({
        where: { id, user: { status: { not: UserStatus.DELETED } } },
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

    if (!result) throw new Error("Job Seeker not found or deleted");
    return result;
};

const updateIntoDB = async (id: string, payload: any) => {
    await prisma.jobSeekerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: UserStatus.DELETED } } },
    });

    return prisma.jobSeekerProfile.update({
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

const softDeleteFromDB = async (id: string) => {
    const profile = await prisma.jobSeekerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: UserStatus.DELETED } } },
    });

    await prisma.user.update({
        where: { id: profile.userId },
        data: { status: UserStatus.DELETED },
    });

    return { message: "Job Seeker soft deleted successfully", id };
};

const hardDeleteFromDB = async (id: string) => {
    const profile = await prisma.jobSeekerProfile.findUniqueOrThrow({ where: { id } });

    await prisma.$transaction([
        prisma.jobSeekerProfile.delete({ where: { id } }),
        prisma.user.delete({ where: { id: profile.userId } }),
        // Add more deletes if you have resumes, skills, etc. later
    ]);

    return { message: "Job Seeker permanently deleted", id };
};

export const JobSeekerService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    softDeleteFromDB,
    hardDeleteFromDB,
};