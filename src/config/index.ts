import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

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
    database_url: process.env.DATABASE_URL as string,
    salt_rounds: Number(process.env.SALT_ROUNDS),

    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
    reset_pass_link: process.env.RESET_PASS_LINK || "http://localhost:3000/reset-password",

    // Security
    jwt: {
        jwt_secret: process.env.JWT_SECRET as string,
        expires_in: process.env.JWT_EXPIRES_IN || "15m",
        refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

        // Password Reset Token Configuration
        reset_pass_secret: process.env.RESET_PASS_SECRET as string,
        reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN || "15m",
    },

    // Super Admin
    super_admin: {
        email: process.env.SUPER_ADMIN_EMAIL as string,
        password: process.env.SUPER_ADMIN_PASSWORD as string,
    },

    // Email Configuration
    email: {
        user: process.env.EMAIL_USER as string,
        app_password: process.env.EMAIL_APP_PASSWORD as string,
        from_name: "iJob Bangladesh",
    },

    verification: {
        sms_webhook_url: process.env.SMS_PROVIDER_WEBHOOK_URL || null,
    },

    // Cloudinary
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string,
    }
};

export default config;
