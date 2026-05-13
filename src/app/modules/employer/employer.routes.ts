import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "../../../prisma/generated/client/enums";
import { EmployerController } from "./employer.controller";
import { employerValidationSchemas } from "./employer.validations";
import { fileUploader } from "../../../helpers/fileUploader";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const router = express.Router();

const parseFormDataJson = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  } catch {
    next(new ApiError(httpStatus.BAD_REQUEST, "Invalid multipart data payload."));
  }
};

router.patch(
  "/me/company",
  auth(UserRole.EMPLOYER),
  fileUploader.upload.fields([
    { name: "file", maxCount: 1 },
    { name: "logoFile", maxCount: 1 },
  ]),
  parseFormDataJson,
  validateRequest(employerValidationSchemas.updateMyCompanyProfile),
  EmployerController.updateMyCompanyProfile,
);

router.post(
  "/me/verification-documents",
  auth(UserRole.EMPLOYER),
  fileUploader.upload.fields([
    { name: "tradeLicenseFile", maxCount: 1 },
    { name: "nidFile", maxCount: 1 },
    { name: "tinFile", maxCount: 1 },
    { name: "binFile", maxCount: 1 },
    { name: "otherDocumentFile", maxCount: 1 },
  ]),
  parseFormDataJson,
  validateRequest(employerValidationSchemas.submitVerificationDocuments),
  EmployerController.submitVerificationDocuments,
);

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
