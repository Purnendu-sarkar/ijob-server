"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const { accessToken, refreshToken, user } = await auth_service_1.AuthServices.loginUser(req.body);
    // Cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: config_1.default.node_env === "production",
        sameSite: "strict",
    };
    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Login successful.",
        data: {
            needPasswordChange: user.needPasswordChange || false,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                emailVerifiedAt: user.emailVerifiedAt,
                phoneVerifiedAt: user.phoneVerifiedAt,
                role: user.role,
                fullName: user.fullName,
                needPasswordChange: user.needPasswordChange || false,
            },
        },
    });
});
const refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token not found!");
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await auth_service_1.AuthServices.refreshToken(refreshToken);
    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: config_1.default.node_env === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: config_1.default.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "New access token generated.",
        data: null,
    });
});
const requestContactVerification = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthServices.requestContactVerification(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.alreadyVerified
            ? "This contact is already verified."
            : "Verification code sent.",
        data: result,
    });
});
const confirmContactVerification = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthServices.confirmContactVerification(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Contact verified successfully.",
        data: result,
    });
});
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthServices.changePassword(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Password changed successfully.",
        data: result,
    });
});
const forgotPassword = (0, catchAsync_1.default)(async (req, res) => {
    await auth_service_1.AuthServices.forgotPassword(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Check your email!",
        data: null,
    });
});
const resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    const user = req.user; // Will be populated if authenticated via middleware
    await auth_service_1.AuthServices.resetPassword(token, req.body, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Password Reset!",
        data: null,
    });
});
const getMe = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user?.userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Authentication required!");
    }
    const result = await auth_service_1.AuthServices.getMe(user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User information retrieved successfully.",
        data: result,
    });
});
const logout = (0, catchAsync_1.default)(async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Logout successful.",
        data: null,
    });
});
exports.AuthController = {
    loginUser,
    refreshToken,
    requestContactVerification,
    confirmContactVerification,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
    logout,
};
