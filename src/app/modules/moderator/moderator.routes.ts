import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../prisma/generated/client/enums';
import validateRequest from '../../middlewares/validateRequest';
import { moderatorValidationSchemas } from './moderator.validations';
import { fileUploader } from '../../../helpers/fileUploader';
import { ModeratorController } from './moderator.controller';

const router = express.Router();

router.get(
    '/',
    auth(UserRole.ADMIN),           // Only Admin can see all moderators
    ModeratorController.getAllFromDB
);

router.get(
    '/:id',
    auth(UserRole.ADMIN),
    ModeratorController.getByIdFromDB
);


router.post(
    '/create-moderator',
    auth(UserRole.ADMIN),
    fileUploader.upload.single("file"),   // profile photo optional
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(moderatorValidationSchemas.createModerator),
    ModeratorController.createModerator
);

router.patch(
    '/:id',
    auth(UserRole.ADMIN),
    validateRequest(moderatorValidationSchemas.updateModerator),
    ModeratorController.updateIntoDB
);

router.delete(
    '/soft/:id',
    auth(UserRole.ADMIN),
    ModeratorController.softDeleteFromDB
);

export const ModeratorRoutes = router;