import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus, VerificationStatus } from '../../../prisma/generated/client/client';
import { prisma } from '../../../lib/prisma';
import config from '../../../config';
import slugify from 'slugify';


const createAdmin = async (payload: any) => {
  const { password, admin, profilePhotoUrl } = payload;

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_rounds));

  // ✅ Timeout  (30 seconds)
  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          email: admin.email,
          phone: admin.phone || null,
          passwordHash: hashedPassword,
          role: UserRole.ADMIN,
          fullName: admin.name,
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
    {
      maxWait: 20000,
      timeout: 30000,
    }
  );
};


const createJobSeeker = async (payload: any) => {
  const {
    password,
    dateOfBirth,
    preferredJobTypes = [],
    preferredLocations = [],
    ...rest
  } = payload;

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_rounds));

  return prisma.$transaction(async (tx) => {
    // 1. Create base User
    const user = await tx.user.create({
      data: {
        email: rest.email,
        phone: rest.phone,
        passwordHash: hashedPassword,
        role: UserRole.JOB_SEEKER,
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
  });
};

const createEmployer = async (payload: any) => {
  const {
    password,
    companyName,
    companyWebsite,
    companyDescription,
    designation,
    logoUrl,
    ...rest
  } = payload;

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_rounds));

  // Generate slug
  const slug = slugify(companyName, {
    lower: true,
    strict: true,
    trim: true,
  });

  return prisma.$transaction(async (tx) => {
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
      throw new Error(
        `A company with name "${companyName}" already exists. ` +
        `Please contact support or join the existing company (approval required).`
      );
    }

    // 2. Create base User
    const user = await tx.user.create({
      data: {
        email: rest.email,
        phone: rest.phone,
        passwordHash: hashedPassword,
        role: UserRole.EMPLOYER,
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
        verificationStatus: VerificationStatus.PENDING,
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
  });
};

export const userService = {
  createJobSeeker,
  createEmployer,
  createAdmin,
};