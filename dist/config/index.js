"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
const requiredEnvVariables = [
    "DATABASE_URL",
    "SALT_ROUNDS",
    "JWT_SECRET",
    "EMAIL_USER",
    "EMAIL_APP_PASSWORD",
    "RESET_PASS_SECRET"
];
requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing required env variable: ${key}`);
    }
});
const config = {
    node_env: process.env.NODE_ENV || "development",
    port: process.env.PORT || "5000",
    database_url: process.env.DATABASE_URL,
    salt_rounds: Number(process.env.SALT_ROUNDS),
    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
    reset_pass_link: process.env.RESET_PASS_LINK || "http://localhost:3000/reset-password",
    // Security
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        expires_in: process.env.JWT_EXPIRES_IN || "15m",
        refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
        // Password Reset Token Configuration
        reset_pass_secret: process.env.RESET_PASS_SECRET,
        reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN || "15m",
    },
    // Super Admin
    super_admin: {
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
    },
    // Email Configuration
    email: {
        user: process.env.EMAIL_USER,
        app_password: process.env.EMAIL_APP_PASSWORD,
        from_name: "iJob Bangladesh",
    },
    verification: {
        sms_webhook_url: process.env.SMS_PROVIDER_WEBHOOK_URL || null,
    },
    // Cloudinary
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    }
};
exports.default = config;
