import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../../../../prisma/generated/prisma/enums";


const router = express.Router();

// Public routes (rate limited)
router.post("/login", AuthController.loginUser);
router.post("/refresh-token", AuthController.refreshToken);
router.post('/forgot-password',AuthController.forgotPassword);

// Protected routes
router.post(
  "/change-password",
  auth(UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.MODERATOR, UserRole.ADMIN),
  AuthController.changePassword
);


export const AuthRoutes = router;