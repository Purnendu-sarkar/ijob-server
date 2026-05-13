"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("../../../prisma/generated/client/client");
const fileUploader_1 = require("../../../helpers/fileUploader");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const user_service_1 = require("./user.service");
const getFiles = (req) => (req.files || {});
const firstFile = (req, ...fieldNames) => {
    const files = getFiles(req);
    for (const fieldName of fieldNames) {
        const file = files[fieldName]?.[0];
        if (file)
            return file;
    }
    return null;
};
const uploadFile = async (file) => {
    if (!file)
        return null;
    const uploaded = await fileUploader_1.fileUploader.uploadToCloudinary(file);
    return {
        url: uploaded?.secure_url || null,
        publicId: uploaded?.public_id || null,
    };
};
const uploadVerificationDocuments = async (req) => {
    const documentFields = [
        { field: "tradeLicenseFile", documentType: client_1.VerificationDocumentType.TRADE_LICENSE },
        { field: "nidFile", documentType: client_1.VerificationDocumentType.NID },
        { field: "tinFile", documentType: client_1.VerificationDocumentType.TIN },
        { field: "binFile", documentType: client_1.VerificationDocumentType.BIN },
        { field: "otherDocumentFile", documentType: client_1.VerificationDocumentType.OTHER },
    ];
    const files = getFiles(req);
    const documents = [];
    for (const { field, documentType } of documentFields) {
        const file = files[field]?.[0];
        if (!file)
            continue;
        const uploaded = await uploadFile(file);
        if (!uploaded?.url)
            continue;
        documents.push({
            documentType,
            fileUrl: uploaded.url,
            filePublicId: uploaded.publicId,
        });
    }
    return documents;
};
const createAdmin = (0, catchAsync_1.default)(async (req, res) => {
    let profilePhotoUrl = null;
    if (req.file) {
        const uploaded = await fileUploader_1.fileUploader.uploadToCloudinary(req.file);
        profilePhotoUrl = uploaded?.secure_url || null;
    }
    const result = await user_service_1.userService.createAdmin({
        ...req.body,
        profilePhotoUrl,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Admin created successfully",
        data: result,
    });
});
const createJobSeeker = (0, catchAsync_1.default)(async (req, res) => {
    const profilePhoto = await uploadFile(firstFile(req, "profilePhotoFile", "file"));
    const resume = await uploadFile(firstFile(req, "resumeFile"));
    const result = await user_service_1.userService.createJobSeeker({
        ...req.body,
        profilePhotoUrl: profilePhoto?.url || req.body.profilePhotoUrl,
        resumeUrl: resume?.url || req.body.resumeUrl,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Job seeker account created successfully",
        data: result,
    });
});
const createEmployer = (0, catchAsync_1.default)(async (req, res) => {
    const logo = await uploadFile(firstFile(req, "logoFile", "file"));
    const verificationDocuments = await uploadVerificationDocuments(req);
    const result = await user_service_1.userService.createEmployer({
        ...req.body,
        logoUrl: logo?.url || req.body.logoUrl,
        verificationDocuments,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Employer and company account created successfully. Verification is pending.",
        data: result,
    });
});
exports.userController = {
    createJobSeeker,
    createEmployer,
    createAdmin,
};
