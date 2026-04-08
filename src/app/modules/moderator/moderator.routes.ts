import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../prisma/generated/client/enums';
import validateRequest from '../../middlewares/validateRequest';
import { moderatorValidationSchemas } from './moderator.validations';
import { fileUploader } from '../../../helpers/fileUploader';
import { ModeratorController } from './moderator.controller';

const router = express.Router();

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

export const ModeratorRoutes = router;