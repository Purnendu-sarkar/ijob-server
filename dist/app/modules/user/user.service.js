"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const http_status_1 = __importDefault(require("http-status"));
const slugify_1 = __importDefault(require("slugify"));
const config_1 = __importDefault(require("../../../config"));
const prisma_1 = require("../../../lib/prisma");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const client_1 = require("../../../prisma/generated/client/client");
const transactionOptions = {
    maxWait: 20000,
    timeout: 30000,
};
const normalizeEmail = (email) => {
    const value = email?.trim().toLowerCase();
    return value || null;
};
const normalizePhone = (phone) => {
    const value = phone?.trim().replace(/^\+?88/, "");
    return value || null;
};
const normalizeTextArray = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};
const requiredCompanyDocumentTypes = [
    client_1.VerificationDocumentType.TRADE_LICENSE,
    client_1.VerificationDocumentType.NID,
];
const hasRequiredCompanyDocuments = (documents) => {
    const submittedTypes = new Set(documents.map((document) => document.documentType));
    return requiredCompanyDocumentTypes.every((type) => submittedTypes.has(type));
};
const calculateJobSeekerCompletion = (payload) => {
    const checks = [
        payload.fullName,
        payload.email || payload.phone,
        payload.skills?.length,
        payload.experienceYears !== undefined && payload.experienceYears !== null,
        payload.education,
        payload.currentLocationId,
        payload.preferredJobTypes?.length,
        payload.preferredLocations?.length,
        payload.resumeUrl,
        payload.about,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
};
const ensureUniqueUserContact = async (tx, payload) => {
    const contactConditions = [];
    if (payload.email) {
        contactConditions.push({ email: payload.email });
    }
    if (payload.phone) {
        contactConditions.push({ phone: payload.phone });
    }
    if (!contactConditions.length) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email or phone number is required.");
    }
    const existingUser = await tx.user.findFirst({
        where: {
            OR: contactConditions,
            status: { not: client_1.UserStatus.DELETED },
        },
        select: {
            email: true,
            phone: true,
        },
    });
    if (!existingUser)
        return;
    if (payload.email && existingUser.email === payload.email) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, "An account with this email already exists.");
    }
    if (payload.phone && existingUser.phone === payload.phone) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, "An account with this phone number already exists.");
    }
    throw new ApiError_1.default(http_status_1.default.CONFLICT, "An account with this contact already exists.");
};
const createUniqueCompanySlug = async (tx, companyName) => {
    const baseSlug = (0, slugify_1.default)(companyName, {
        lower: true,
        strict: true,
        trim: true,
    }) || "company";
    let slug = baseSlug;
    let suffix = 1;
    while (await tx.company.findUnique({ where: { slug }, select: { id: true } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
    }
    return slug;
};
const createAdmin = async (payload) => {
    const { password, admin, profilePhotoUrl } = payload;
    const email = normalizeEmail(admin.email);
    const phone = normalizePhone(admin.phone);
    const hashedPassword = await bcrypt.hash(password, Number(config_1.default.salt_rounds));
    return prisma_1.prisma.$transaction(async (tx) => {
        await ensureUniqueUserContact(tx, { email, phone });
        const user = await tx.user.create({
            data: {
                email,
                phone,
                passwordHash: hashedPassword,
                role: client_1.UserRole.ADMIN,
                fullName: admin.name.trim(),
                profilePhotoUrl: profilePhotoUrl || null,
                needPasswordChange: false,
                status: client_1.UserStatus.ACTIVE,
            },
        });
        const adminProfile = await tx.adminProfile.create({
            data: {
                userId: user.id,
                department: admin.department || null,
                permissions: admin.permissions || null,
            },
        });
        return {
            id: adminProfile.id,
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            profilePhoto: user.profilePhotoUrl,
            department: adminProfile.department,
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
    }, transactionOptions);
};
const createJobSeeker = async (payload) => {
    const email = normalizeEmail(payload.email);
    const phone = normalizePhone(payload.phone);
    const skills = normalizeTextArray(payload.skills);
    const preferredLocations = normalizeTextArray(payload.preferredLocations);
    const preferredJobTypes = normalizeTextArray(payload.preferredJobTypes);
    const hashedPassword = await bcrypt.hash(payload.password, Number(config_1.default.salt_rounds));
    return prisma_1.prisma.$transaction(async (tx) => {
        await ensureUniqueUserContact(tx, { email, phone });
        const user = await tx.user.create({
            data: {
                email,
                phone,
                passwordHash: hashedPassword,
                role: client_1.UserRole.JOB_SEEKER,
                fullName: payload.fullName.trim(),
                needPasswordChange: false,
                profilePhotoUrl: payload.profilePhotoUrl || null,
            },
        });
        const profilePayload = {
            ...payload,
            email,
            phone,
            skills,
            preferredLocations,
            preferredJobTypes,
        };
        const profile = await tx.jobSeekerProfile.create({
            data: {
                userId: user.id,
                fullName: payload.fullName.trim(),
                dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
                gender: payload.gender || null,
                currentLocationId: payload.currentLocationId || null,
                expectedSalaryMin: payload.expectedSalaryMin,
                expectedSalaryMax: payload.expectedSalaryMax,
                experienceYears: payload.experienceYears,
                about: payload.about || null,
                education: payload.education || null,
                skills,
                resumeUrl: payload.resumeUrl || null,
                videoIntroUrl: payload.videoIntroUrl || null,
                preferredJobTypes: preferredJobTypes,
                preferredLocations,
                profileCompletion: calculateJobSeekerCompletion(profilePayload),
            },
        });
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            fullName: user.fullName,
            profileCompletion: profile.profileCompletion,
            createdAt: user.createdAt,
        };
    }, transactionOptions);
};
const createEmployer = async (payload) => {
    const email = normalizeEmail(payload.email);
    const phone = normalizePhone(payload.phone);
    const hashedPassword = await bcrypt.hash(payload.password, Number(config_1.default.salt_rounds));
    return prisma_1.prisma.$transaction(async (tx) => {
        await ensureUniqueUserContact(tx, { email, phone });
        const existingCompany = await tx.company.findFirst({
            where: {
                name: {
                    equals: payload.companyName.trim(),
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });
        if (existingCompany) {
            throw new ApiError_1.default(http_status_1.default.CONFLICT, `A company with name "${payload.companyName}" already exists. Please contact support or join the existing company after approval.`);
        }
        const slug = await createUniqueCompanySlug(tx, payload.companyName);
        const user = await tx.user.create({
            data: {
                email,
                phone,
                passwordHash: hashedPassword,
                role: client_1.UserRole.EMPLOYER,
                fullName: payload.fullName.trim(),
                profilePhotoUrl: payload.profilePhotoUrl || null,
                needPasswordChange: false,
            },
        });
        const verificationDocuments = Array.isArray(payload.verificationDocuments)
            ? payload.verificationDocuments
            : [];
        const verificationReadyForReview = hasRequiredCompanyDocuments(verificationDocuments);
        const company = await tx.company.create({
            data: {
                name: payload.companyName.trim(),
                slug,
                description: payload.companyDescription || null,
                website: payload.companyWebsite || null,
                logoUrl: payload.logoUrl || null,
                address: payload.companyAddress || null,
                industry: payload.companyIndustry || null,
                companySize: payload.companySize || null,
                contactEmail: email,
                contactPhone: phone,
                tradeLicenseNumber: payload.tradeLicenseNumber || null,
                verificationStatus: client_1.VerificationStatus.PENDING,
                verificationSubmittedAt: verificationReadyForReview ? new Date() : null,
            },
        });
        await tx.employerProfile.create({
            data: {
                userId: user.id,
                companyId: company.id,
                designation: payload.designation || null,
                contactName: payload.fullName.trim(),
            },
        });
        if (verificationDocuments.length) {
            await tx.verificationDocument.createMany({
                data: verificationDocuments.map((document) => ({
                    companyId: company.id,
                    uploadedByUserId: user.id,
                    documentType: document.documentType,
                    fileUrl: document.fileUrl,
                    filePublicId: document.filePublicId || null,
                    status: client_1.VerificationStatus.PENDING,
                })),
            });
        }
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            fullName: user.fullName,
            company: {
                id: company.id,
                name: company.name,
                slug: company.slug,
                status: company.verificationStatus,
            },
            verificationDocuments: verificationDocuments.length,
            verificationReadyForReview,
            createdAt: user.createdAt,
        };
    }, transactionOptions);
};
exports.userService = {
    createJobSeeker,
    createEmployer,
    createAdmin,
};
