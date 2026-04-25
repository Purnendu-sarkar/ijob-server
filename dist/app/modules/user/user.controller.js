"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const user_service_1 = require("./user.service");
const fileUploader_1 = require("../../../helpers/fileUploader");
const createAdmin = (0, catchAsync_1.default)(async (req, res) => {
    let profilePhotoUrl = null;
    // File upload to Cloudinary
    if (req.file) {
        const uploaded = await fileUploader_1.fileUploader.uploadToCloudinary(req.file);
        profilePhotoUrl = uploaded?.secure_url || null;
    }
    // Merge file URL with body
    const payload = {
        ...req.body,
        profilePhotoUrl,
    };
    const result = await user_service_1.userService.createAdmin(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Admin created successfully",
        data: result,
    });
});
const createJobSeeker = (0, catchAsync_1.default)(async (req, res) => {
    console.log("DATA", req.body);
    // ── File upload ───────────────────────────────────────
    let profilePhotoUrl = null;
    if (req.file) {
        const uploaded = await fileUploader_1.fileUploader.uploadToCloudinary(req.file);
        profilePhotoUrl = uploaded?.secure_url;
    }
    // Merge file url into body
    const payload = {
        ...req.body,
        profilePhotoUrl: profilePhotoUrl || req.body.profilePhotoUrl,
    };
    const result = await user_service_1.userService.createJobSeeker(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Job Seeker account created successfully",
        data: result,
    });
});
const createEmployer = (0, catchAsync_1.default)(async (req, res) => {
    let logoUrl = null;
    if (req.file) {
        const uploaded = await fileUploader_1.fileUploader.uploadToCloudinary(req.file);
        logoUrl = uploaded?.secure_url;
    }
    const payload = {
        ...req.body,
        logoUrl: logoUrl || req.body.logoUrl,
    };
    const result = await user_service_1.userService.createEmployer(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Employer & Company account created successfully (pending verification)",
        data: result,
    });
});
exports.userController = {
    createJobSeeker,
    createEmployer,
    createAdmin,
};
