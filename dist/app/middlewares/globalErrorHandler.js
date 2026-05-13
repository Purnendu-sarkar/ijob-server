"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const zod_1 = require("zod");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const getPrismaConflictMessage = (target) => {
    if (Array.isArray(target)) {
        if (target.includes("email"))
            return "An account with this email already exists.";
        if (target.includes("phone"))
            return "An account with this phone number already exists.";
        if (target.includes("slug"))
            return "This company slug is already taken.";
    }
    return "Duplicate record found.";
};
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err?.statusCode || http_status_1.default.INTERNAL_SERVER_ERROR;
    let message = err?.message || "Something went wrong!";
    let errorDetails = err;
    if (err instanceof zod_1.ZodError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Validation failed";
        errorDetails = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
    }
    else if (err instanceof ApiError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errorDetails = undefined;
    }
    else if (err?.code === "P2002") {
        statusCode = http_status_1.default.CONFLICT;
        message = getPrismaConflictMessage(err?.meta?.target);
        errorDetails = undefined;
    }
    else if (err?.code === "LIMIT_FILE_SIZE") {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Uploaded file must be 5MB or smaller.";
        errorDetails = undefined;
    }
    else if (err?.name === "MulterError") {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = err.message || "File upload failed.";
        errorDetails = undefined;
    }
    res.status(statusCode).json({
        success: false,
        message,
        error: config_1.default.node_env === "development" ? errorDetails : undefined,
    });
};
exports.default = globalErrorHandler;
