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
    const result = await employer_service_1.EmployerService.updateIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employer profile updated successfully!",
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
    softDeleteFromDB,
    hardDeleteFromDB,
};
