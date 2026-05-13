"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("../../../prisma/generated/client/client");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
// Public routes (rate limited)
router.post("/login", auth_controller_1.AuthController.loginUser);
router.post("/verification/request", (0, validateRequest_1.default)(auth_validation_1.authValidation.requestContactVerification), auth_controller_1.AuthController.requestContactVerification);
router.post("/verification/confirm", (0, validateRequest_1.default)(auth_validation_1.authValidation.confirmContactVerification), auth_controller_1.AuthController.confirmContactVerification);
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
router.post('/forgot-password', auth_controller_1.AuthController.forgotPassword);
router.post("/reset-password", auth_controller_1.AuthController.resetPassword);
router.post("/logout", auth_controller_1.AuthController.logout);
// Protected routes
router.post("/change-password", (0, auth_1.default)(client_1.UserRole.JOB_SEEKER, client_1.UserRole.EMPLOYER, client_1.UserRole.MODERATOR, client_1.UserRole.ADMIN), auth_controller_1.AuthController.changePassword);
router.get('/me', (0, auth_1.default)(client_1.UserRole.JOB_SEEKER, client_1.UserRole.EMPLOYER, client_1.UserRole.MODERATOR, client_1.UserRole.ADMIN), auth_controller_1.AuthController.getMe);
exports.AuthRoutes = router;
