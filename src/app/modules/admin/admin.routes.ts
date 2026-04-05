import express from 'express';
import { AdminController } from './admin.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../prisma/generated/client/enums';

const router = express.Router();

router.get(
    '/',
    auth( UserRole.ADMIN),
    AdminController.getAllFromDB
);

export const AdminRoutes = router;