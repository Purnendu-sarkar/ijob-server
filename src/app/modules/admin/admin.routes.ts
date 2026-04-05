import express from 'express';
import { AdminController } from './admin.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../prisma/generated/client/enums';
import validateRequest from '../../middlewares/validateRequest';
import { adminValidationSchemas } from './admin.validations';

const router = express.Router();

router.get(
    '/',
    auth(UserRole.ADMIN),
    AdminController.getAllFromDB
);

router.get(
    '/:id',
    auth(UserRole.ADMIN),
    AdminController.getByIdFromDB
);

router.patch(
    '/:id',
    auth(UserRole.ADMIN),
    validateRequest(adminValidationSchemas.update),
    AdminController.updateIntoDB
);

router.delete(
    '/soft/:id',
    auth(UserRole.ADMIN),
    AdminController.softDeleteFromDB
);

export const AdminRoutes = router;