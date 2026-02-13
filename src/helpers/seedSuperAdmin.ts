import { UserRole, UserStatus } from './../../prisma/generated/prisma/enums';
import * as bcrypt from "bcryptjs";
import config from "../config";
import { prisma } from "../lib/prisma";
// import prisma from "../shared/prisma";

const seedSuperAdmin = async () => {
  // Skip in production for safety
  if (process.env.NODE_ENV === "production") {
    console.log("⛔ Seeding super admin is disabled in production.");
    return;
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (existing) {
      console.log("✅ Super admin already exists →", existing.email);
      return;
    }

    const hashedPassword = await bcrypt.hash(
      config.super_admin_password || "ChangeMeImmediately123!",
      config.salt_rounds
    );

    const admin = await prisma.user.create({
      data: {
        email: config.super_admin_email,
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        fullName: "Super Administrator",
        adminProfile: {
          create: {
            // Add fields if you have them (department, etc.)
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        adminProfile: true,
      },
    });

    console.log("🚀 Super Admin created successfully!");
    console.log("Email →", admin.email);
    console.log("User ID →", admin.id);
    console.log("Profile ID →", admin.adminProfile?.id);
    console.log("\nUse password from .env or default: ", config.super_admin_password);
    console.log("CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!");
  } catch (err) {
    console.error("❌ Failed to create super admin:", err);
  } finally {
    await prisma.$disconnect();
  }
};

export default seedSuperAdmin;