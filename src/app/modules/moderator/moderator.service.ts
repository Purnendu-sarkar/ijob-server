import bcrypt from 'bcryptjs';
import { Prisma, UserRole, UserStatus } from "../../../prisma/generated/client/client";
import { prisma } from "../../../lib/prisma";
import config from "../../../config";

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


export const ModeratorService = {
    createModerator,
};