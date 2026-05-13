import express from 'express';
import { userController } from './user.controller';
import { fileUploader } from '../../../helpers/fileUploader';
import validateRequest from '../../middlewares/validateRequest';
import { userValidation } from './user.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../prisma/generated/client/enums';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

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

router.post(
  "/create-admin",
  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  parseFormDataJson,
  validateRequest(userValidation.createAdmin),
  userController.createAdmin
);

// Public registration endpoints
router.post(
  "/register/job-seeker",
  fileUploader.upload.fields([
    { name: "file", maxCount: 1 },
    { name: "profilePhotoFile", maxCount: 1 },
    { name: "resumeFile", maxCount: 1 },
  ]),
  parseFormDataJson,
  validateRequest(userValidation.createJobSeeker),
  userController.createJobSeeker
);

router.post(
  "/register/employer",
  fileUploader.upload.fields([
    { name: "file", maxCount: 1 },
    { name: "logoFile", maxCount: 1 },
    { name: "tradeLicenseFile", maxCount: 1 },
    { name: "nidFile", maxCount: 1 },
    { name: "tinFile", maxCount: 1 },
    { name: "binFile", maxCount: 1 },
    { name: "otherDocumentFile", maxCount: 1 },
  ]),
  parseFormDataJson,
  validateRequest(userValidation.createEmployer),
  userController.createEmployer
);

export const userRoutes = router;
