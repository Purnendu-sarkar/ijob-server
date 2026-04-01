"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const enums_1 = require("../../../../prisma/generated/prisma/enums");
const router = express_1.default.Router();
// Public routes (rate limited)
router.post("/login", auth_controller_1.AuthController.loginUser);
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
router.post('/forgot-password', auth_controller_1.AuthController.forgotPassword);
router.post("/reset-password", auth_controller_1.AuthController.resetPassword);
router.post("/logout", auth_controller_1.AuthController.logout);
// Protected routes
router.post("/change-password", (0, auth_1.default)(enums_1.UserRole.JOB_SEEKER, enums_1.UserRole.EMPLOYER, enums_1.UserRole.MODERATOR, enums_1.UserRole.ADMIN), auth_controller_1.AuthController.changePassword);
router.get('/me', (0, auth_1.default)(enums_1.UserRole.JOB_SEEKER, enums_1.UserRole.EMPLOYER, enums_1.UserRole.MODERATOR, enums_1.UserRole.ADMIN), auth_controller_1.AuthController.getMe);
exports.AuthRoutes = router;
