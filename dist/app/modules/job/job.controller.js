"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const job_service_1 = require("./job.service");
const createJob = (0, catchAsync_1.default)(async (req, res) => {
    const result = await job_service_1.JobService.createJobIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Job posted successfully!",
        data: result,
    });
});
const getAllFromDB = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await job_service_1.JobService.getAllFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Jobs fetched successfully!",
        data: result,
    });
});
exports.JobController = {
    createJob,
    getAllFromDB,
};
