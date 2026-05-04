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
const client_1 = require("../../../prisma/generated/client/client");
const prisma_1 = require("../../../lib/prisma");
const config_1 = __importDefault(require("../../../config"));
const slugify_1 = __importDefault(require("slugify"));
const transactionOptions = {
    maxWait: 20000,
    timeout: 30000,
};
const createAdmin = async (payload) => {
    const { password, admin, profilePhotoUrl } = payload;
    const hashedPassword = await bcrypt.hash(password, Number(config_1.default.salt_rounds));
    // ✅ Timeout  (30 seconds)
    return prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: admin.email,
                phone: admin.phone || null,
                passwordHash: hashedPassword,
                role: client_1.UserRole.ADMIN,
                fullName: admin.name,
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
    }, {
        maxWait: 20000,
        timeout: 30000,
    });
};
const createJobSeeker = async (payload) => {
    const { password, dateOfBirth, preferredJobTypes = [], preferredLocations = [], ...rest } = payload;
    const hashedPassword = await bcrypt.hash(password, Number(config_1.default.salt_rounds));
    return prisma_1.prisma.$transaction(async (tx) => {
        // 1. Create base User
        const user = await tx.user.create({
            data: {
                email: rest.email,
                phone: rest.phone,
                passwordHash: hashedPassword,
                role: client_1.UserRole.JOB_SEEKER,
                fullName: rest.fullName,
                needPasswordChange: false,
                profilePhotoUrl: rest.profilePhotoUrl,
            },
        });
        // 2. Create JobSeekerProfile
        await tx.jobSeekerProfile.create({
            data: {
                userId: user.id,
                fullName: rest.fullName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender: rest.gender,
                currentLocationId: rest.currentLocationId,
                expectedSalaryMin: rest.expectedSalaryMin,
                expectedSalaryMax: rest.expectedSalaryMax,
                experienceYears: rest.experienceYears,
                about: rest.about,
                preferredJobTypes,
                preferredLocations,
            },
        });
        // Return minimal safe data
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            createdAt: user.createdAt,
        };
    }, transactionOptions);
};
const createEmployer = async (payload) => {
    const { password, companyName, companyWebsite, companyDescription, designation, logoUrl, ...rest } = payload;
    const hashedPassword = await bcrypt.hash(password, Number(config_1.default.salt_rounds));
    // Generate slug
    const slug = (0, slugify_1.default)(companyName, {
        lower: true,
        strict: true,
        trim: true,
    });
    return prisma_1.prisma.$transaction(async (tx) => {
        // 1. Check if company with this name already exists (case insensitive)
        const existingCompany = await tx.company.findFirst({
            where: {
                name: {
                    equals: companyName,
                    mode: 'insensitive',
                },
            },
        });
        if (existingCompany) {
            throw new Error(`A company with name "${companyName}" already exists. ` +
                `Please contact support or join the existing company (approval required).`);
        }
        // 2. Create base User
        const user = await tx.user.create({
            data: {
                email: rest.email,
                phone: rest.phone,
                passwordHash: hashedPassword,
                role: client_1.UserRole.EMPLOYER,
                fullName: rest.fullName,
                profilePhotoUrl: rest.profilePhotoUrl || null,
                needPasswordChange: false,
            },
        });
        // 3. Create Company
        const company = await tx.company.create({
            data: {
                name: companyName,
                slug,
                description: companyDescription,
                website: companyWebsite,
                logoUrl: logoUrl || null,
                verificationStatus: client_1.VerificationStatus.PENDING,
            },
        });
        // 4. Create EmployerProfile
        await tx.employerProfile.create({
            data: {
                userId: user.id,
                companyId: company.id,
                designation: designation || null,
                contactName: rest.fullName || null,
            },
        });
        // Return safe minimal data
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            company: {
                id: company.id,
                name: company.name,
                slug: company.slug,
                status: company.verificationStatus,
            },
            createdAt: user.createdAt,
        };
    }, transactionOptions);
};
exports.userService = {
    createJobSeeker,
    createEmployer,
    createAdmin,
};
