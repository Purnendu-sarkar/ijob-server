"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const prisma_1 = require("../../../lib/prisma");
const client_1 = require("../../../prisma/generated/client/client");
const emailSender_1 = __importDefault(require("./emailSender"));
const normalizePhone = (phone) => phone?.trim().replace(/^\+?88/, "") || null;
const normalizeEmail = (email) => email?.trim().toLowerCase() || null;
const phonePattern = /^(?:\+?88)?01[3-9]\d{8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const verificationCodeTtlMinutes = 10;
const verificationMaxAttempts = 5;
const maskEmail = (email) => {
    const [name, domain] = email.split("@");
    if (!name || !domain)
        return email;
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(name.length - visible.length, 2))}@${domain}`;
};
const maskPhone = (phone) => `${phone.slice(0, 3)}*****${phone.slice(-3)}`;
const resolveVerificationContact = (payload) => {
    const rawIdentifier = String(payload.identifier || "").trim();
    const isPhoneIdentifier = phonePattern.test(rawIdentifier);
    const isEmailIdentifier = emailPattern.test(rawIdentifier);
    if (!isPhoneIdentifier && !isEmailIdentifier) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Enter a valid email or Bangladeshi phone number.");
    }
    if (isEmailIdentifier) {
        const email = normalizeEmail(rawIdentifier);
        const channel = payload.channel || client_1.VerificationChannel.EMAIL;
        if (channel !== client_1.VerificationChannel.EMAIL) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email verification must use the EMAIL channel.");
        }
        return {
            email,
            phone: null,
            channel,
            maskedIdentifier: maskEmail(email),
        };
    }
    const phone = normalizePhone(rawIdentifier);
    const channel = payload.channel || client_1.VerificationChannel.SMS;
    if (channel === client_1.VerificationChannel.EMAIL) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Phone verification must use SMS or WHATSAPP.");
    }
    return {
        email: null,
        phone,
        channel,
        maskedIdentifier: maskPhone(phone),
    };
};
const sendVerificationEmail = async (email, code) => {
    await (0, emailSender_1.default)(email, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Inter', Arial, sans-serif;color:#1a202c;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding:40px;background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">iJob Bangladesh</h1>
                  <p style="margin:10px 0 0;color:#94a3b8;font-size:16px;">Empowering Careers in Bangladesh</p>
                </td>
              </tr>
              <tr>
                <td style="padding:48px 40px;">
                  <h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;">Verify your identity</h2>
                  <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#475569;">
                    Thank you for joining iJob! To complete your registration and ensure the security of your account, please use the following verification code:
                  </p>
                  <div style="background-color:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                    <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0f172a;font-family:monospace;">${code}</span>
                  </div>
                  <p style="margin:0 0 32px;font-size:14px;color:#64748b;text-align:center;">
                    This code will expire in <strong style="color:#0f172a;">10 minutes</strong>.
                  </p>
                  <div style="border-top:1px solid #e2e8f0;padding-top:24px;">
                    <p style="margin:0;font-size:14px;line-height:20px;color:#94a3b8;">
                      If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 40px;background-color:#f8fafc;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:18px;">
                    © ${new Date().getFullYear()} iJob Bangladesh. All rights reserved.<br>
                    Dhaka, Bangladesh
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `, "Verify your iJob account");
};
const sendPhoneVerificationCode = async (phone, code, channel) => {
    if (config_1.default.verification.sms_webhook_url) {
        const response = await fetch(config_1.default.verification.sms_webhook_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone, code, channel }),
        });
        if (!response.ok) {
            throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, "Could not deliver verification code through the SMS/WhatsApp provider.");
        }
        return;
    }
    if (config_1.default.node_env !== "production") {
        console.info(`[iJob verification:${channel}] ${phone} -> ${code}`);
        return;
    }
    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "SMS/WhatsApp verification provider is not configured yet. Add an email or configure SMS_PROVIDER_WEBHOOK_URL.");
};
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
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
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
const requestContactVerification = async (payload) => {
    const contact = resolveVerificationContact(payload);
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            ...(contact.email ? { email: contact.email } : { phone: contact.phone }),
            status: client_1.UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            phone: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
        },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found or account not active.");
    }
    const alreadyVerified = contact.email ? user.emailVerifiedAt : user.phoneVerifiedAt;
    if (alreadyVerified) {
        return {
            alreadyVerified: true,
            channel: contact.channel,
            identifier: contact.maskedIdentifier,
            expiresInMinutes: 0,
        };
    }
    const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
    const codeHash = await bcryptjs_1.default.hash(code, Number(config_1.default.salt_rounds));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + verificationCodeTtlMinutes * 60 * 1000);
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.verificationToken.updateMany({
            where: {
                userId: user.id,
                purpose: client_1.VerificationPurpose.SIGNUP,
                consumedAt: null,
                ...(contact.email ? { email: contact.email } : { phone: contact.phone }),
            },
            data: {
                consumedAt: now,
            },
        });
        await tx.verificationToken.create({
            data: {
                userId: user.id,
                email: contact.email,
                phone: contact.phone,
                codeHash,
                channel: contact.channel,
                purpose: client_1.VerificationPurpose.SIGNUP,
                expiresAt,
            },
        });
    });
    if (contact.email) {
        await sendVerificationEmail(contact.email, code);
    }
    else if (contact.phone) {
        await sendPhoneVerificationCode(contact.phone, code, contact.channel);
    }
    return {
        alreadyVerified: false,
        channel: contact.channel,
        identifier: contact.maskedIdentifier,
        expiresInMinutes: verificationCodeTtlMinutes,
        ...(config_1.default.node_env !== "production" ? { debugCode: code } : {}),
    };
};
const confirmContactVerification = async (payload) => {
    const contact = resolveVerificationContact(payload);
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            ...(contact.email ? { email: contact.email } : { phone: contact.phone }),
            status: client_1.UserStatus.ACTIVE,
        },
        select: {
            id: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
        },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found or account not active.");
    }
    const token = await prisma_1.prisma.verificationToken.findFirst({
        where: {
            userId: user.id,
            purpose: client_1.VerificationPurpose.SIGNUP,
            channel: contact.channel,
            consumedAt: null,
            expiresAt: { gt: new Date() },
            ...(contact.email ? { email: contact.email } : { phone: contact.phone }),
        },
        orderBy: { createdAt: "desc" },
    });
    if (!token) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Verification code is invalid or expired.");
    }
    if (token.attempts >= verificationMaxAttempts) {
        await prisma_1.prisma.verificationToken.update({
            where: { id: token.id },
            data: { consumedAt: new Date() },
        });
        throw new ApiError_1.default(http_status_1.default.TOO_MANY_REQUESTS, "Too many invalid attempts. Request a new code.");
    }
    const isCodeValid = await bcryptjs_1.default.compare(payload.code.trim(), token.codeHash);
    if (!isCodeValid) {
        await prisma_1.prisma.verificationToken.update({
            where: { id: token.id },
            data: { attempts: { increment: 1 } },
        });
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Verification code is incorrect.");
    }
    const verifiedAt = new Date();
    const updatedUser = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.verificationToken.update({
            where: { id: token.id },
            data: { consumedAt: verifiedAt },
        });
        return tx.user.update({
            where: { id: user.id },
            data: contact.email
                ? { emailVerifiedAt: user.emailVerifiedAt || verifiedAt }
                : { phoneVerifiedAt: user.phoneVerifiedAt || verifiedAt },
            select: {
                id: true,
                emailVerifiedAt: true,
                phoneVerifiedAt: true,
            },
        });
    });
    return {
        id: updatedUser.id,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
        phoneVerifiedAt: updatedUser.phoneVerifiedAt,
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
    requestContactVerification,
    confirmContactVerification,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
};
