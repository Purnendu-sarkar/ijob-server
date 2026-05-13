"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const pick_1 = __importDefault(require("../../../shared/pick"));
const employer_constant_1 = require("./employer.constant");
const employer_service_1 = require("./employer.service");
const fileUploader_1 = require("../../../helpers/fileUploader");
const client_1 = require("../../../prisma/generated/client/client");
const firstFile = (req, ...fieldNames) => {
    const files = (req.files || {});
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
    const fields = [
        { field: "tradeLicenseFile", documentType: client_1.VerificationDocumentType.TRADE_LICENSE },
        { field: "nidFile", documentType: client_1.VerificationDocumentType.NID },
        { field: "tinFile", documentType: client_1.VerificationDocumentType.TIN },
        { field: "binFile", documentType: client_1.VerificationDocumentType.BIN },
        { field: "otherDocumentFile", documentType: client_1.VerificationDocumentType.OTHER },
    ];
    const files = (req.files || {});
    const documents = [];
    for (const { field, documentType } of fields) {
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
const getAllFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const filters = (0, pick_1.default)(req.query, employer_constant_1.employerFilterableFields);
    const options = (0, pick_1.default)(req.query, ["limit", "page", "sortBy", "sortOrder"]);
    const result = await employer_service_1.EmployerService.getAllFromDB(filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employers fetched successfully!",
        meta: result.meta,
        data: result.data,
    });
});
const getByIdFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await employer_service_1.EmployerService.getByIdFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employer fetched successfully!",
        data: result,
    });
});
const updateIntoDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await employer_service_1.EmployerService.updateIntoDB(id, req.body, req.user?.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employer profile updated successfully!",
        data: result,
    });
});
const updateMyCompanyProfile = (0, catchAsync_1.default)(async (req, res) => {
    const logo = await uploadFile(firstFile(req, "logoFile", "file"));
    const result = await employer_service_1.EmployerService.updateMyCompanyProfile(req.user.userId, {
        ...req.body,
        ...(logo?.url ? { logoUrl: logo.url } : {}),
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Company profile updated successfully!",
        data: result,
    });
});
const submitVerificationDocuments = (0, catchAsync_1.default)(async (req, res) => {
    const documents = await uploadVerificationDocuments(req);
    const result = await employer_service_1.EmployerService.submitVerificationDocuments(req.user.userId, documents);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Verification documents submitted successfully!",
        data: result,
    });
});
const softDeleteFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await employer_service_1.EmployerService.softDeleteFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employer soft deleted successfully!",
        data: result,
    });
});
const hardDeleteFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await employer_service_1.EmployerService.hardDeleteFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employer permanently deleted!",
        data: result,
    });
});
exports.EmployerController = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    updateMyCompanyProfile,
    submitVerificationDocuments,
    softDeleteFromDB,
    hardDeleteFromDB,
};
