import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "../../../prisma/generated/client/client";
import { JobController } from "./job.controller";
import { jobValidationSchemas } from "./job.validations";

const router = express.Router();

router.get("/", JobController.getAllFromDB);

router.post(
  "/",
  auth(UserRole.EMPLOYER),
  validateRequest(jobValidationSchemas.createJob),
  JobController.createJob,
);

export const JobRoutes = router;

