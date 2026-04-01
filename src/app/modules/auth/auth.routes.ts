import express from "express";
import { AuthController } from "./auth.controller";


const router = express.Router();

// Public routes (rate limited)
router.post("/login", AuthController.loginUser);
router.post("/refresh-token", AuthController.refreshToken);


export const AuthRoutes = router;