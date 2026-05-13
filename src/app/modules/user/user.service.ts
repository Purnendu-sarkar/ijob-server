import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import slugify from "slugify";
import config from "../../../config";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../errors/ApiError";
import {
  UserRole,
  UserStatus,
  VerificationDocumentType,
  VerificationStatus,
} from "../../../prisma/generated/client/client";

const transactionOptions = {
  maxWait: 20000,
  timeout: 30000,
};

const normalizeEmail = (email?: string | null) => {
  const value = email?.trim().toLowerCase();
  return value || null;
};

const normalizePhone = (phone?: string | null) => {
  const value = phone?.trim().replace(/^\+?88/, "");
  return value || null;
};

const normalizeTextArray = (value: unknown) => {
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

const calculateJobSeekerCompletion = (payload: any) => {
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

const ensureUniqueUserContact = async (
  tx: any,
  payload: { email?: string | null; phone?: string | null },
) => {
  const contactConditions = [];

  if (payload.email) {
    contactConditions.push({ email: payload.email });
  }

  if (payload.phone) {
    contactConditions.push({ phone: payload.phone });
  }

  if (!contactConditions.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email or phone number is required.");
  }

  const existingUser = await tx.user.findFirst({
    where: {
      OR: contactConditions,
      status: { not: UserStatus.DELETED },
    },
    select: {
      email: true,
      phone: true,
    },
  });

  if (!existingUser) return;

  if (payload.email && existingUser.email === payload.email) {
    throw new ApiError(httpStatus.CONFLICT, "An account with this email already exists.");
  }

  if (payload.phone && existingUser.phone === payload.phone) {
    throw new ApiError(httpStatus.CONFLICT, "An account with this phone number already exists.");
  }

  throw new ApiError(httpStatus.CONFLICT, "An account with this contact already exists.");
};

const createUniqueCompanySlug = async (tx: any, companyName: string) => {
  const baseSlug =
    slugify(companyName, {
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

const createAdmin = async (payload: any) => {
  const { password, admin, profilePhotoUrl } = payload;
  const email = normalizeEmail(admin.email);
  const phone = normalizePhone(admin.phone);
  const hashedPassword = await bcrypt.hash(password, Number(config.salt_rounds));

  return prisma.$transaction(
    async (tx) => {
      await ensureUniqueUserContact(tx, { email, phone });

      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash: hashedPassword,
          role: UserRole.ADMIN,
          fullName: admin.name.trim(),
          profilePhotoUrl: profilePhotoUrl || null,
          needPasswordChange: false,
          status: UserStatus.ACTIVE,
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
    },
    transactionOptions,
  );
};

const createJobSeeker = async (payload: any) => {
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const skills = normalizeTextArray(payload.skills);
  const preferredLocations = normalizeTextArray(payload.preferredLocations);
  const preferredJobTypes = normalizeTextArray(payload.preferredJobTypes);

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt_rounds));

  return prisma.$transaction(async (tx) => {
    await ensureUniqueUserContact(tx, { email, phone });

    const user = await tx.user.create({
      data: {
        email,
        phone,
        passwordHash: hashedPassword,
        role: UserRole.JOB_SEEKER,
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
        preferredJobTypes: preferredJobTypes as any,
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

const createEmployer = async (payload: any) => {
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt_rounds));

  return prisma.$transaction(async (tx) => {
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
      throw new ApiError(
        httpStatus.CONFLICT,
        `A company with name "${payload.companyName}" already exists. Please contact support or join the existing company after approval.`,
      );
    }

    const slug = await createUniqueCompanySlug(tx, payload.companyName);

    const user = await tx.user.create({
      data: {
        email,
        phone,
        passwordHash: hashedPassword,
        role: UserRole.EMPLOYER,
        fullName: payload.fullName.trim(),
        profilePhotoUrl: payload.profilePhotoUrl || null,
        needPasswordChange: false,
      },
    });

    const verificationDocuments = Array.isArray(payload.verificationDocuments)
      ? payload.verificationDocuments
      : [];

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
        verificationStatus: VerificationStatus.PENDING,
        verificationSubmittedAt: verificationDocuments.length ? new Date() : null,
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
        data: verificationDocuments.map((document: any) => ({
          companyId: company.id,
          uploadedByUserId: user.id,
          documentType: document.documentType as VerificationDocumentType,
          fileUrl: document.fileUrl,
          filePublicId: document.filePublicId || null,
          status: VerificationStatus.PENDING,
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
      createdAt: user.createdAt,
    };
  }, transactionOptions);
};

export const userService = {
  createJobSeeker,
  createEmployer,
  createAdmin,
};
