import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const requiredEnvVariables = [
    "DATABASE_URL",
    "SALT_ROUNDS"
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
    super_admin_email: process.env.SUPER_ADMIN_EMAIL as string,
    super_admin_password: process.env.SUPER_ADMIN_PASSWORD,

    jwt: {
        jwt_secret: process.env.JWT_SECRET as string,
        expires_in: process.env.JWT_EXPIRES_IN || "7d",
    },

    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string,
    }
};

export default config;
