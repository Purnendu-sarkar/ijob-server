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
const client_1 = require("../prisma/generated/client/client");
const bcrypt = __importStar(require("bcryptjs"));
const config_1 = __importDefault(require("../config"));
const prisma_1 = require("../lib/prisma");
const seedSuperAdmin = async () => {
    // Skip in production for safety
    if (process.env.NODE_ENV === "production") {
        console.log("⛔ Seeding super admin is disabled in production.");
        return;
    }
    try {
        const existing = await prisma_1.prisma.user.findFirst({
            where: { role: client_1.UserRole.ADMIN },
        });
        if (existing) {
            console.log("✅ Super admin already exists →", existing.email);
            return;
        }
        const hashedPassword = await bcrypt.hash(config_1.default.super_admin.password || "ChangeMeImmediately123!", config_1.default.salt_rounds);
        const admin = await prisma_1.prisma.user.create({
            data: {
                email: config_1.default.super_admin.password,
                passwordHash: hashedPassword,
                role: client_1.UserRole.ADMIN,
                status: client_1.UserStatus.ACTIVE,
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
        console.log("\nUse password from .env or default: ", config_1.default.super_admin.password);
        console.log("CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!");
    }
    catch (err) {
        console.error("❌ Failed to create super admin:", err);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
};
exports.default = seedSuperAdmin;
