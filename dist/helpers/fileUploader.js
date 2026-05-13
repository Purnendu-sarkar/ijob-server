"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploader = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config"));
const ApiError_1 = __importDefault(require("../app/errors/ApiError"));
const uploadDir = path_1.default.join(process.cwd(), "uploads");
const ensureUploadDir = () => {
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
};
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
]);
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        ensureUploadDir();
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const safeBase = path_1.default
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, "-")
            .slice(0, 60);
        cb(null, `${safeBase || "upload"}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
async function uploadToCloudinary(file) {
    cloudinary_1.v2.config({
        cloud_name: config_1.default.cloudinary.cloud_name,
        api_key: config_1.default.cloudinary.api_key,
        api_secret: config_1.default.cloudinary.api_secret,
    });
    try {
        return await cloudinary_1.v2.uploader.upload(file.path, {
            public_id: `${path_1.default.parse(file.filename).name}`,
            folder: "ijob_project",
            resource_type: "auto",
        });
    }
    finally {
        if (file.path && fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
    }
}
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 8,
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            cb(new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Only JPG, PNG, WEBP, and PDF files are allowed."));
            return;
        }
        cb(null, true);
    },
});
exports.fileUploader = {
    upload,
    uploadToCloudinary,
};
