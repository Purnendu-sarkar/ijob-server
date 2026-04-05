import express from 'express';
import { AdminController } from './admin.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../prisma/generated/client/enums';

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

export const AdminRoutes = router;