import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../../../prisma/generated/client/client";


const router = express.Router();

// Public routes (rate limited)
router.post("/login", AuthController.loginUser);
router.post("/refresh-token", AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/logout", AuthController.logout);

// Protected routes
router.post(
  "/change-password",
  auth(UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.MODERATOR, UserRole.ADMIN),
  AuthController.changePassword
);
router.get(
  '/me',
  auth(UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.MODERATOR, UserRole.ADMIN),
  AuthController.getMe
);


export const AuthRoutes = router;