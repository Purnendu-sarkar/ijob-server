"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSeekerController = void 0;
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const jobSeeker_service_1 = require("./jobSeeker.service");
const pick_1 = __importDefault(require("../../../shared/pick"));
const jobSeeker_constant_1 = require("./jobSeeker.constant");
const fileUploader_1 = require("../../../helpers/fileUploader");
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
    return uploaded?.secure_url || null;
};
const getAllFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const filters = (0, pick_1.default)(req.query, jobSeeker_constant_1.jobSeekerFilterableFields);
    const options = (0, pick_1.default)(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await jobSeeker_service_1.JobSeekerService.getAllFromDB(filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Job Seekers fetched successfully!",
        meta: result.meta,
        data: result.data,
    });
});
const getByIdFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await jobSeeker_service_1.JobSeekerService.getByIdFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Job Seeker profile fetched successfully!",
        data: result,
    });
});
const updateIntoDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await jobSeeker_service_1.JobSeekerService.updateIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Job Seeker profile updated successfully!",
        data: result,
    });
});
const updateMyProfile = (0, catchAsync_1.default)(async (req, res) => {
    const profilePhotoUrl = await uploadFile(firstFile(req, 'profilePhotoFile', 'file'));
    const resumeUrl = await uploadFile(firstFile(req, 'resumeFile'));
    const result = await jobSeeker_service_1.JobSeekerService.updateMyProfile(req.user.userId, {
        ...req.body,
        ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
        ...(resumeUrl ? { resumeUrl } : {}),
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Your job seeker profile updated successfully!",
        data: result,
    });
});
const softDeleteFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await jobSeeker_service_1.JobSeekerService.softDeleteFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Job Seeker soft deleted successfully!",
        data: result,
    });
});
const hardDeleteFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await jobSeeker_service_1.JobSeekerService.hardDeleteFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Job Seeker permanently deleted!",
        data: result,
    });
});
exports.JobSeekerController = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    updateMyProfile,
    softDeleteFromDB,
    hardDeleteFromDB,
};
