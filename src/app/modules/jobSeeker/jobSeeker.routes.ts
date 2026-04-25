import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { fileUploader } from '../../../helpers/fileUploader';
import { JobSeekerController } from './jobSeeker.controller';
import { jobSeekerValidationSchemas } from './jobSeeker.validation';
import { UserRole } from '../../../prisma/generated/client/enums';


const router = express.Router();

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