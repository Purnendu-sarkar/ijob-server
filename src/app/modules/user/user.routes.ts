import express from 'express';
import { userController } from './user.controller';
import { fileUploader } from '../../../helpers/fileUploader';
import validateRequest from '../../middlewares/validateRequest';
import { userValidation } from './user.validation';

const router = express.Router();

// Public registration endpoints
router.post(
  "/register/job-seeker",
  fileUploader.upload.single("file"),
  (req, res, next) => {
    // Parse JSON string if sent as form-data
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(userValidation.createJobSeeker),
  userController.createJobSeeker
);

export const userRoutes = router;