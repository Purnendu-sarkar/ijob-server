import httpStatus from "http-status";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import ApiError from "../../errors/ApiError";
const loginUser = catchAsync(async (req, res) => {
    const { accessToken, refreshToken, user } = await AuthServices.loginUser(req.body);
    // Cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: config.node_env === "production",
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
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful.",
        data: {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                needPasswordChange: user.needPasswordChange || false,
            },
        },
    });
});
const refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        throw new Error("Refresh token not found!");
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await AuthServices.refreshToken(refreshToken);
    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New access token generated.",
        data: null,
    });
});
const changePassword = catchAsync(async (req, res) => {
    const result = await AuthServices.changePassword(req.user, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password changed successfully.",
        data: result,
    });
});
const forgotPassword = catchAsync(async (req, res) => {
    await AuthServices.forgotPassword(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Check your email!",
        data: null,
    });
});
const resetPassword = catchAsync(async (req, res) => {
    console.log("REQ", req);
    // Extract token from Authorization header (remove "Bearer " prefix)
    const authHeader = req.headers.authorization;
    console.log(authHeader, "authHeader in resetPassword controller");
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    const user = req.user; // Will be populated if authenticated via middleware
    await AuthServices.resetPassword(token, req.body, user);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password Reset!",
        data: null,
    });
});
const getMe = catchAsync(async (req, res) => {
    const user = req.user;
    if (!user?.userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required!");
    }
    const result = await AuthServices.getMe(user);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User information retrieved successfully.",
        data: result,
    });
});
const logout = catchAsync(async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Logout successful.",
        data: null,
    });
});
export const AuthController = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
    logout,
};
