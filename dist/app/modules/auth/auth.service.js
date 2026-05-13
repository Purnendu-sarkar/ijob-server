"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const prisma_1 = require("../../../lib/prisma");
const client_1 = require("../../../prisma/generated/client/client");
const emailSender_1 = __importDefault(require("./emailSender"));
const normalizePhone = (phone) => phone?.trim().replace(/^\+?88/, "") || null;
const normalizeEmail = (email) => email?.trim().toLowerCase() || null;
const loginUser = async (payload) => {
    const identifier = String(payload.identifier || payload.email || payload.phone || "").trim();
    const normalizedPhone = normalizePhone(identifier);
    const normalizedEmail = normalizeEmail(identifier);
    const isPhoneIdentifier = /^(?:\+?88)?01[3-9]\d{8}$/.test(identifier);
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            OR: isPhoneIdentifier
                ? [{ phone: normalizedPhone }]
                : [{ email: normalizedEmail }, { phone: normalizedPhone }],
            status: client_1.UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            phone: true,
            passwordHash: true,
            role: true,
            fullName: true,
            needPasswordChange: true,
        },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found or account not active.");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid password.");
    }
    const accessToken = jwtHelpers_1.jwtHelpers.generateToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role }, config_1.default.jwt.jwt_secret, "15m" // short lived
    );
    const refreshToken = jwtHelpers_1.jwtHelpers.generateToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role }, config_1.default.jwt.jwt_secret, // same secret for simplicity (or use different)
    "30d");
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    return {
        accessToken,
        refreshToken,
        user,
    };
};
const refreshToken = async (oldRefreshToken) => {
    let decoded;
    try {
        decoded = jwtHelpers_1.jwtHelpers.verifyToken(oldRefreshToken, config_1.default.jwt.jwt_secret);
    }
    catch (err) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid or expired refresh token");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: decoded.userId, status: client_1.UserStatus.ACTIVE },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const newAccessToken = jwtHelpers_1.jwtHelpers.generateToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role }, config_1.default.jwt.jwt_secret, "15m");
    const newRefreshToken = jwtHelpers_1.jwtHelpers.generateToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role }, config_1.default.jwt.jwt_secret, "30d");
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};
const changePassword = async (user, payload) => {
    const dbUser = await prisma_1.prisma.user.findUniqueOrThrow({
        where: { id: user.userId },
    });
    const isOldPasswordCorrect = await bcryptjs_1.default.compare(payload.oldPassword, dbUser.passwordHash);
    if (!isOldPasswordCorrect) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid old password.");
    }
    const hashed = await bcryptjs_1.default.hash(payload.newPassword, config_1.default.salt_rounds);
    await prisma_1.prisma.user.update({
        where: { id: user.userId },
        data: {
            passwordHash: hashed,
            needPasswordChange: false,
        },
    });
    return { message: "Password changed successfully." };
};
const forgotPassword = async (payload) => {
    const userData = await prisma_1.prisma.user.findFirstOrThrow({
        where: {
            email: normalizeEmail(payload.email),
            status: client_1.UserStatus.ACTIVE,
        },
    });
    if (!userData.email) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "This account does not have an email address.");
    }
    const resetPassToken = jwtHelpers_1.jwtHelpers.generateToken({ email: userData.email, userId: userData.id, role: userData.role }, config_1.default.jwt.reset_pass_secret, config_1.default.jwt.reset_pass_token_expires_in);
    const resetPassLink = `${config_1.default.reset_pass_link}?email=${encodeURIComponent(userData.email)}&token=${resetPassToken}`;
    await (0, emailSender_1.default)(userData.email, `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset password - iJob Bangladesh</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table role="presentation" style="inline-size: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-inline-size: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 25px 40px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">iJob Bangladesh</h1>
                                <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 15px;">Correct Job, Correct Time</p>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td style="padding: 45px 40px 40px 40px;">
                                <h2 style="margin: 0 0 20px 0; color: #1e2937; font-size: 24px; font-weight: 600;">
                                    Reset Password
                                </h2>
                                
                                <p style="margin: 0 0 25px 0; color: #334155; font-size: 16px; line-height: 26px;">
                                    Dear User,
                                </p>
                                
                                <p style="margin: 0 0 30px 0; color: #334155; font-size: 16px; line-height: 26px;">
                                    You have requested to reset your password for your iJob Bangladesh account. 
                                    Please click the button below to create a new password:
                                </p>

                                <!-- Reset Button -->
                                <table role="presentation" style="margin: 0 auto 30px auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
                                            <a href="${resetPassLink}" 
                                               style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Fallback Link -->
                                <p style="margin: 20px 0 8px 0; color: #64748b; font-size: 14.5px;">
                                    Or copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0 0 35px 0; color: #2563eb; font-size: 14px; line-height: 22px; word-break: break-all;">
                                    ${resetPassLink}
                                </p>

                                <!-- Security Notice -->
                                <div style="background-color: #f8fafc; border-inline-start: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                                    <p style="margin: 0 0 12px 0; color: #1e2937; font-size: 15px; font-weight: 600;">
                                        Security Notice:
                                    </p>
                                    <ul style="margin: 0; padding-inline-start: 20px; color: #475569; font-size: 14.5px; line-height: 24px;">
                                        <li>This link is only valid for <strong>15 minutes</strong></li>
                                        <li>If you did not request this, please ignore this email</li>
                                        <li>For security reasons, do not share this link with anyone</li>
                                    </ul>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 35px 40px; background-color: #f8fafc; text-align: center; border-block-start: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                                    © ${new Date().getFullYear()} iJob Bangladesh. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                                    This is an automated email. Please do not reply.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `);
};
const resetPassword = async (token, payload, user) => {
    let userEmail;
    // Case 1: Token-based reset (from forgot password email)
    if (token) {
        const decodedToken = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.reset_pass_secret);
        if (!decodedToken) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Invalid or expired reset token!");
        }
        // Verify email from token matches the email in payload
        if (payload.email && decodedToken.email !== payload.email) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Email mismatch! Invalid reset request.");
        }
        userEmail = decodedToken.email;
    }
    // Case 2: Authenticated user with needPasswordChange (newly created admin/doctor)
    else if (user && user.email) {
        const authenticatedUser = await prisma_1.prisma.user.findUniqueOrThrow({
            where: {
                email: user.email,
                status: client_1.UserStatus.ACTIVE
            }
        });
        // Verify user actually needs password change
        if (!authenticatedUser.needPasswordChange) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "You don't need to reset your password. Use change password instead.");
        }
        userEmail = user.email;
    }
    else {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid request. Either provide a valid token or be authenticated.");
    }
    // hash password
    const password = await bcryptjs_1.default.hash(payload.password, Number(config_1.default.salt_rounds));
    // update into database
    await prisma_1.prisma.user.update({
        where: {
            email: userEmail
        },
        data: {
            passwordHash: password,
            needPasswordChange: false
        }
    });
};
const getMe = async (userFromRequest) => {
    if (!userFromRequest?.userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Authentication required!");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: {
            id: userFromRequest.userId,
            status: client_1.UserStatus.ACTIVE,
        },
        include: {
            jobSeekerProfile: true,
            employerProfile: {
                include: {
                    company: {
                        include: {
                            verificationDocuments: {
                                orderBy: {
                                    createdAt: "desc",
                                },
                            },
                        },
                    },
                },
            },
            moderatorProfile: true,
            adminProfile: true,
        },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found or account not active.");
    }
    // Base user information (common for all roles)
    const baseUser = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        emailVerifiedAt: user.emailVerifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        role: user.role,
        fullName: user.fullName,
        profilePhotoUrl: user.profilePhotoUrl,
        needPasswordChange: user.needPasswordChange,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    let profile = null;
    switch (user.role) {
        case client_1.UserRole.JOB_SEEKER:
            if (user.jobSeekerProfile) {
                profile = {
                    jobSeekerProfile: {
                        fullName: user.jobSeekerProfile.fullName,
                        dateOfBirth: user.jobSeekerProfile.dateOfBirth,
                        gender: user.jobSeekerProfile.gender,
                        currentLocationId: user.jobSeekerProfile.currentLocationId,
                        expectedSalaryMin: user.jobSeekerProfile.expectedSalaryMin,
                        expectedSalaryMax: user.jobSeekerProfile.expectedSalaryMax,
                        experienceYears: user.jobSeekerProfile.experienceYears,
                        about: user.jobSeekerProfile.about,
                        education: user.jobSeekerProfile.education,
                        skills: user.jobSeekerProfile.skills,
                        resumeUrl: user.jobSeekerProfile.resumeUrl,
                        videoIntroUrl: user.jobSeekerProfile.videoIntroUrl,
                        preferredJobTypes: user.jobSeekerProfile.preferredJobTypes,
                        preferredLocations: user.jobSeekerProfile.preferredLocations,
                        profileCompletion: user.jobSeekerProfile.profileCompletion,
                        isProfileVerified: user.jobSeekerProfile.isProfileVerified,
                    },
                };
            }
            break;
        case client_1.UserRole.EMPLOYER:
            if (user.employerProfile) {
                profile = {
                    employerProfile: {
                        designation: user.employerProfile.designation,
                        contactName: user.employerProfile.contactName,
                        company: user.employerProfile.company
                            ? {
                                id: user.employerProfile.company.id,
                                name: user.employerProfile.company.name,
                                slug: user.employerProfile.company.slug,
                                logoUrl: user.employerProfile.company.logoUrl,
                                description: user.employerProfile.company.description,
                                website: user.employerProfile.company.website,
                                address: user.employerProfile.company.address,
                                industry: user.employerProfile.company.industry,
                                companySize: user.employerProfile.company.companySize,
                                contactEmail: user.employerProfile.company.contactEmail,
                                contactPhone: user.employerProfile.company.contactPhone,
                                tradeLicenseNumber: user.employerProfile.company.tradeLicenseNumber,
                                verificationStatus: user.employerProfile.company.verificationStatus,
                                verificationSubmittedAt: user.employerProfile.company.verificationSubmittedAt,
                                verificationReviewedAt: user.employerProfile.company.verificationReviewedAt,
                                verificationRejectionReason: user.employerProfile.company.verificationRejectionReason,
                                verificationDocuments: user.employerProfile.company.verificationDocuments,
                            }
                            : null,
                    },
                };
            }
            break;
        case client_1.UserRole.MODERATOR:
            if (user.moderatorProfile) {
                profile = {
                    moderatorProfile: {
                        bio: user.moderatorProfile.bio,
                        assignedRegions: user.moderatorProfile.assignedRegions,
                    },
                };
            }
            break;
        case client_1.UserRole.ADMIN:
            if (user.adminProfile) {
                profile = {
                    adminProfile: {
                        department: user.adminProfile.department,
                        permissions: user.adminProfile.permissions || null,
                    },
                };
            }
            break;
        default:
            // Should never reach here due to enum constraint, but just in case
            break;
    }
    return {
        ...baseUser,
        ...(profile || {}),
    };
};
exports.AuthServices = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
};
