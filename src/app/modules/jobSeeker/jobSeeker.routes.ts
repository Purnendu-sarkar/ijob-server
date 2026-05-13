import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { fileUploader } from '../../../helpers/fileUploader';
import { JobSeekerController } from './jobSeeker.controller';
import { jobSeekerValidationSchemas } from './jobSeeker.validation';
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

router.patch(
  '/me/profile',
  auth(UserRole.JOB_SEEKER),
  fileUploader.upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'profilePhotoFile', maxCount: 1 },
    { name: 'resumeFile', maxCount: 1 },
  ]),
  parseFormDataJson,
  validateRequest(jobSeekerValidationSchemas.updateMyJobSeekerProfile),
  JobSeekerController.updateMyProfile
);

// Admin + Moderator can view all / single seeker
router.get('/', auth(UserRole.ADMIN, UserRole.MODERATOR), JobSeekerController.getAllFromDB);
router.get('/:id', auth(UserRole.ADMIN, UserRole.MODERATOR), JobSeekerController.getByIdFromDB);

// Update - Admin & Moderator both can update (or only Admin depending on policy)
router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest(jobSeekerValidationSchemas.updateJobSeekerProfile),
  JobSeekerController.updateIntoDB
);

// Soft Delete - Both Admin & Moderator
router.delete('/soft/:id', auth(UserRole.ADMIN, UserRole.MODERATOR), JobSeekerController.softDeleteFromDB);

// Hard Delete - Only Admin
router.delete('/:id', auth(UserRole.ADMIN), JobSeekerController.hardDeleteFromDB);

export const JobSeekerRoutes = router;
