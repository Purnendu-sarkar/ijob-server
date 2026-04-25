"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorController = void 0;
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const fileUploader_1 = require("../../../helpers/fileUploader");
const moderator_service_1 = require("./moderator.service");
const pick_1 = __importDefault(require("../../../shared/pick"));
const moderator_constant_1 = require("./moderator.constant");
const createModerator = (0, catchAsync_1.default)(async (req, res) => {
    let profilePhotoUrl = null;
    if (req.file) {
        const uploaded = await fileUploader_1.fileUploader.uploadToCloudinary(req.file);
        profilePhotoUrl = uploaded?.secure_url || null;
    }
    const payload = {
        ...req.body,
        profilePhotoUrl,
    };
    const result = await moderator_service_1.ModeratorService.createModerator(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Moderator created successfully",
        data: result,
    });
});
const getAllFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const filters = (0, pick_1.default)(req.query, moderator_constant_1.moderatorFilterableFields);
    const options = (0, pick_1.default)(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await moderator_service_1.ModeratorService.getAllFromDB(filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Moderators fetched successfully!",
        meta: result.meta,
        data: result.data
    });
});
const getByIdFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await moderator_service_1.ModeratorService.getByIdFromDB(id);
    console.log("Result", result);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Moderator data fetched by id!",
        data: result
    });
});
const updateIntoDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await moderator_service_1.ModeratorService.updateIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Moderator updated successfully!",
        data: result
    });
});
const softDeleteFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await moderator_service_1.ModeratorService.softDeleteFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Moderator soft deleted successfully!",
        data: result
    });
});
const deleteFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await moderator_service_1.ModeratorService.deleteFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Moderator permanently deleted!",
        data: result
    });
});
exports.ModeratorController = {
    createModerator,
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    softDeleteFromDB,
    deleteFromDB
};
