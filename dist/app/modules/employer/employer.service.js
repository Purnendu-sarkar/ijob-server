"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const prisma_1 = require("../../../lib/prisma");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const client_1 = require("../../../prisma/generated/client/client");
const employerSelect = {
    id: true,
    userId: true,
    designation: true,
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
    company: {
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            website: true,
            logoUrl: true,
            address: true,
            verificationStatus: true,
            createdAt: true,
            updatedAt: true,
        },
    },
};
const getAllFromDB = async (params, options) => {
    const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            OR: [
                { user: { fullName: { contains: searchTerm, mode: "insensitive" } } },
                { user: { email: { contains: searchTerm, mode: "insensitive" } } },
                { user: { phone: { contains: searchTerm, mode: "insensitive" } } },
                { company: { name: { contains: searchTerm, mode: "insensitive" } } },
                { designation: { contains: searchTerm, mode: "insensitive" } },
            ],
        });
    }
    if (filterData.fullName) {
        andConditions.push({
            user: { fullName: { contains: filterData.fullName, mode: "insensitive" } },
        });
    }
    if (filterData.email) {
        andConditions.push({
            user: { email: { contains: filterData.email, mode: "insensitive" } },
        });
    }
    if (filterData.phone) {
        andConditions.push({
            user: { phone: { contains: filterData.phone, mode: "insensitive" } },
        });
    }
    if (filterData.companyName) {
        andConditions.push({
            company: { name: { contains: filterData.companyName, mode: "insensitive" } },
        });
    }
    if (filterData.designation) {
        andConditions.push({
            designation: { contains: filterData.designation, mode: "insensitive" },
        });
    }
    if (filterData.companyVerificationStatus === "PENDING" ||
        filterData.companyVerificationStatus === "VERIFIED" ||
        filterData.companyVerificationStatus === "REJECTED") {
        andConditions.push({
            company: {
                verificationStatus: filterData.companyVerificationStatus,
            },
        });
    }
    andConditions.push({
        user: { status: { not: client_1.UserStatus.DELETED } },
    });
    const whereConditions = { AND: andConditions };
    let orderBy = {
        createdAt: "desc",
    };
    if (options.sortBy && options.sortOrder) {
        if (options.sortBy === "name") {
            orderBy = { user: { fullName: options.sortOrder } };
        }
        else if (options.sortBy === "email") {
            orderBy = { user: { email: options.sortOrder } };
        }
        else if (options.sortBy === "phone") {
            orderBy = { user: { phone: options.sortOrder } };
        }
        else if (options.sortBy === "companyName") {
            orderBy = { company: { name: options.sortOrder } };
        }
        else if (options.sortBy === "companyVerificationStatus") {
            orderBy = {
                company: { verificationStatus: options.sortOrder },
            };
        }
        else {
            orderBy = { [options.sortBy]: options.sortOrder };
        }
    }
    const result = await prisma_1.prisma.employerProfile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy,
        select: employerSelect,
    });
    const total = await prisma_1.prisma.employerProfile.count({ where: whereConditions });
    return {
        meta: { page, limit, total },
        data: result,
    };
};
const getByIdFromDB = async (id) => {
    const result = await prisma_1.prisma.employerProfile.findFirst({
        where: {
            id,
            user: { status: { not: client_1.UserStatus.DELETED } },
        },
        select: employerSelect,
    });
    if (!result) {
        throw new Error("Employer not found or deleted");
    }
    return result;
};
const updateIntoDB = async (id, payload) => {
    const existingEmployer = await prisma_1.prisma.employerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: client_1.UserStatus.DELETED } } },
        select: {
            userId: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });
    return prisma_1.prisma.$transaction(async (tx) => {
        const updateData = {};
        const companyData = {};
        if (typeof payload.name === "string" && payload.name.trim()) {
            updateData.user = {
                update: { fullName: payload.name.trim() },
            };
        }
        if (typeof payload.phone === "string" && payload.phone.trim()) {
            updateData.user = {
                update: {
                    ...(typeof payload.name === "string" && payload.name.trim()
                        ? { fullName: payload.name.trim() }
                        : {}),
                    phone: payload.phone.trim(),
                },
            };
        }
        if (typeof payload.designation === "string") {
            updateData.designation = payload.designation.trim() || null;
        }
        if (typeof payload.companyName === "string" && payload.companyName.trim()) {
            const nextCompanyName = payload.companyName.trim();
            if (nextCompanyName !== existingEmployer.company.name) {
                const duplicate = await tx.company.findFirst({
                    where: {
                        name: { equals: nextCompanyName, mode: "insensitive" },
                        id: { not: existingEmployer.companyId },
                    },
                });
                if (duplicate) {
                    throw new Error(`A company named "${nextCompanyName}" already exists.`);
                }
                companyData.name = nextCompanyName;
                companyData.slug = (0, slugify_1.default)(nextCompanyName, {
                    lower: true,
                    strict: true,
                    trim: true,
                });
            }
        }
        if (typeof payload.companyDescription === "string") {
            companyData.description = payload.companyDescription.trim() || null;
        }
        if (typeof payload.companyWebsite === "string") {
            companyData.website = payload.companyWebsite.trim() || null;
        }
        if (typeof payload.companyAddress === "string") {
            companyData.address = payload.companyAddress.trim() || null;
        }
        if (payload.companyVerificationStatus === "PENDING" ||
            payload.companyVerificationStatus === "VERIFIED" ||
            payload.companyVerificationStatus === "REJECTED") {
            companyData.verificationStatus = payload.companyVerificationStatus;
        }
        if (Object.keys(companyData).length > 0) {
            await tx.company.update({
                where: { id: existingEmployer.companyId },
                data: companyData,
            });
        }
        return tx.employerProfile.update({
            where: { id },
            data: updateData,
            select: employerSelect,
        });
    });
};
const softDeleteFromDB = async (id) => {
    const employer = await prisma_1.prisma.employerProfile.findFirstOrThrow({
        where: { id, user: { status: { not: client_1.UserStatus.DELETED } } },
        select: {
            userId: true,
        },
    });
    await prisma_1.prisma.user.update({
        where: { id: employer.userId },
        data: { status: client_1.UserStatus.DELETED },
    });
    return { message: "Employer soft deleted successfully", id };
};
const hardDeleteFromDB = async (id) => {
    const employer = await prisma_1.prisma.employerProfile.findUniqueOrThrow({
        where: { id },
        select: {
            userId: true,
            companyId: true,
        },
    });
    return prisma_1.prisma.$transaction(async (tx) => {
        const remainingEmployers = await tx.employerProfile.count({
            where: {
                companyId: employer.companyId,
                id: { not: id },
            },
        });
        await tx.employerProfile.delete({ where: { id } });
        await tx.user.delete({ where: { id: employer.userId } });
        if (remainingEmployers === 0) {
            await tx.company.delete({ where: { id: employer.companyId } });
        }
        return { message: "Employer permanently deleted", id };
    });
};
exports.EmployerService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    softDeleteFromDB,
    hardDeleteFromDB,
};
