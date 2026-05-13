"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const prisma_1 = require("../../../lib/prisma");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("../../../prisma/generated/client/client");
const requiredCompanyDocumentTypes = [
    client_1.VerificationDocumentType.TRADE_LICENSE,
    client_1.VerificationDocumentType.NID,
];
const hasRequiredCompanyDocuments = (documents) => {
    const submittedTypes = new Set(documents.map((document) => document.documentType));
    return requiredCompanyDocumentTypes.every((type) => submittedTypes.has(type));
};
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
            industry: true,
            companySize: true,
            contactEmail: true,
            contactPhone: true,
            tradeLicenseNumber: true,
            verificationStatus: true,
            verificationSubmittedAt: true,
            verificationReviewedAt: true,
            verificationRejectionReason: true,
            createdAt: true,
            updatedAt: true,
            verificationDocuments: {
                orderBy: {
                    createdAt: "desc",
                },
            },
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
const updateIntoDB = async (id, payload, reviewerUserId) => {
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
        if (typeof payload.companyIndustry === "string") {
            companyData.industry = payload.companyIndustry.trim() || null;
        }
        if (typeof payload.companySize === "string") {
            companyData.companySize = payload.companySize.trim() || null;
        }
        if (typeof payload.tradeLicenseNumber === "string") {
            companyData.tradeLicenseNumber = payload.tradeLicenseNumber.trim() || null;
        }
        const nextVerificationStatus = payload.companyVerificationStatus === "PENDING" ||
            payload.companyVerificationStatus === "VERIFIED" ||
            payload.companyVerificationStatus === "REJECTED"
            ? payload.companyVerificationStatus
            : null;
        if (nextVerificationStatus) {
            if (nextVerificationStatus === client_1.VerificationStatus.VERIFIED) {
                const documents = await tx.verificationDocument.findMany({
                    where: { companyId: existingEmployer.companyId },
                    select: { documentType: true },
                });
                if (!hasRequiredCompanyDocuments(documents)) {
                    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Trade License and NID/Contact Person ID are required before verifying a company.");
                }
            }
            companyData.verificationStatus = nextVerificationStatus;
            companyData.verificationReviewedAt = new Date();
            companyData.verificationRejectionReason =
                nextVerificationStatus === client_1.VerificationStatus.REJECTED
                    ? payload.verificationRejectionReason || "Verification rejected."
                    : null;
        }
        if (Object.keys(companyData).length > 0) {
            await tx.company.update({
                where: { id: existingEmployer.companyId },
                data: companyData,
            });
        }
        if (nextVerificationStatus) {
            const documentData = nextVerificationStatus === client_1.VerificationStatus.PENDING
                ? {
                    status: client_1.VerificationStatus.PENDING,
                    reviewedAt: null,
                    reviewedByUserId: null,
                    rejectionReason: null,
                }
                : {
                    status: nextVerificationStatus,
                    reviewedAt: new Date(),
                    reviewedByUserId: reviewerUserId || null,
                    rejectionReason: nextVerificationStatus === client_1.VerificationStatus.REJECTED
                        ? payload.verificationRejectionReason || "Verification rejected."
                        : null,
                };
            await tx.verificationDocument.updateMany({
                where: { companyId: existingEmployer.companyId },
                data: documentData,
            });
        }
        return tx.employerProfile.update({
            where: { id },
            data: updateData,
            select: employerSelect,
        });
    });
};
const updateMyCompanyProfile = async (userId, payload) => {
    const existingEmployer = await prisma_1.prisma.employerProfile.findUniqueOrThrow({
        where: { userId },
        select: {
            id: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    return prisma_1.prisma.$transaction(async (tx) => {
        const userData = {};
        const profileData = {};
        const companyData = {};
        if (typeof payload.name === "string" && payload.name.trim()) {
            userData.fullName = payload.name.trim();
            profileData.contactName = payload.name.trim();
        }
        if (typeof payload.phone === "string" && payload.phone.trim()) {
            const normalizedPhone = payload.phone.trim().replace(/^\+?88/, "");
            const duplicate = await tx.user.findFirst({
                where: {
                    phone: normalizedPhone,
                    id: { not: userId },
                    status: { not: client_1.UserStatus.DELETED },
                },
            });
            if (duplicate) {
                throw new ApiError_1.default(http_status_1.default.CONFLICT, "An account with this phone number already exists.");
            }
            userData.phone = normalizedPhone;
            companyData.contactPhone = normalizedPhone;
        }
        if (typeof payload.designation === "string") {
            profileData.designation = payload.designation.trim() || null;
        }
        if (typeof payload.companyName === "string" && payload.companyName.trim()) {
            const nextCompanyName = payload.companyName.trim();
            if (nextCompanyName !== existingEmployer.company.name) {
                const duplicateCompany = await tx.company.findFirst({
                    where: {
                        name: { equals: nextCompanyName, mode: "insensitive" },
                        id: { not: existingEmployer.companyId },
                    },
                });
                if (duplicateCompany) {
                    throw new ApiError_1.default(http_status_1.default.CONFLICT, `A company named "${nextCompanyName}" already exists.`);
                }
                companyData.name = nextCompanyName;
                companyData.slug = (0, slugify_1.default)(nextCompanyName, {
                    lower: true,
                    strict: true,
                    trim: true,
                });
                companyData.verificationStatus = client_1.VerificationStatus.PENDING;
                companyData.verificationReviewedAt = null;
                companyData.verificationRejectionReason = null;
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
        if (typeof payload.companyIndustry === "string") {
            companyData.industry = payload.companyIndustry.trim() || null;
        }
        if (typeof payload.companySize === "string") {
            companyData.companySize = payload.companySize.trim() || null;
        }
        if (typeof payload.tradeLicenseNumber === "string") {
            companyData.tradeLicenseNumber = payload.tradeLicenseNumber.trim() || null;
        }
        if (payload.logoUrl) {
            companyData.logoUrl = payload.logoUrl;
        }
        if (Object.keys(userData).length) {
            await tx.user.update({
                where: { id: userId },
                data: userData,
            });
        }
        if (Object.keys(profileData).length) {
            await tx.employerProfile.update({
                where: { userId },
                data: profileData,
            });
        }
        if (Object.keys(companyData).length) {
            await tx.company.update({
                where: { id: existingEmployer.companyId },
                data: companyData,
            });
        }
        return tx.employerProfile.findUnique({
            where: { userId },
            select: employerSelect,
        });
    });
};
const submitVerificationDocuments = async (userId, documents) => {
    if (!documents.length) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Please upload at least one verification document.");
    }
    const employer = await prisma_1.prisma.employerProfile.findUniqueOrThrow({
        where: { userId },
        select: {
            companyId: true,
        },
    });
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.verificationDocument.createMany({
            data: documents.map((document) => ({
                companyId: employer.companyId,
                uploadedByUserId: userId,
                documentType: document.documentType,
                fileUrl: document.fileUrl,
                filePublicId: document.filePublicId || null,
                status: client_1.VerificationStatus.PENDING,
            })),
        });
        const documentsAfterUpload = await tx.verificationDocument.findMany({
            where: { companyId: employer.companyId },
            select: { documentType: true },
        });
        const readyForReview = hasRequiredCompanyDocuments(documentsAfterUpload);
        await tx.company.update({
            where: { id: employer.companyId },
            data: {
                verificationStatus: client_1.VerificationStatus.PENDING,
                verificationSubmittedAt: readyForReview ? new Date() : null,
                verificationReviewedAt: null,
                verificationRejectionReason: null,
            },
        });
    });
    return prisma_1.prisma.company.findUnique({
        where: { id: employer.companyId },
        include: {
            verificationDocuments: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
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
    updateMyCompanyProfile,
    submitVerificationDocuments,
    softDeleteFromDB,
    hardDeleteFromDB,
};
