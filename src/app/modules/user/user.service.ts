import * as bcrypt from 'bcryptjs';
import { UserRole, VerificationStatus } from '../../../../prisma/generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import config from '../../../config';

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


export const userService = {
  createJobSeeker,
};