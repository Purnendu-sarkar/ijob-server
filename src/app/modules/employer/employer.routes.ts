import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "../../../prisma/generated/client/enums";
import { EmployerController } from "./employer.controller";
import { employerValidationSchemas } from "./employer.validations";

const router = express.Router();

router.get("/", auth(UserRole.ADMIN), EmployerController.getAllFromDB);
router.get("/:id", auth(UserRole.ADMIN), EmployerController.getByIdFromDB);
router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(employerValidationSchemas.updateEmployerProfile),
  EmployerController.updateIntoDB,
);
router.delete("/soft/:id", auth(UserRole.ADMIN), EmployerController.softDeleteFromDB);
router.delete("/:id", auth(UserRole.ADMIN), EmployerController.hardDeleteFromDB);

export const EmployerRoutes = router;

