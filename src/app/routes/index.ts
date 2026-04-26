import express from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { ModeratorRoutes } from '../modules/moderator/moderator.routes';
import { JobSeekerRoutes } from '../modules/jobSeeker/jobSeeker.routes';
import { EmployerRoutes } from '../modules/employer/employer.routes';


const router = express.Router();

const moduleRoutes = [
    {
        path: '/users',
        route: userRoutes
    },
    {
        path: '/admin',
        route: AdminRoutes
    },
    {
        path: '/moderators',
        route: ModeratorRoutes
    },
    {
        path: '/job-seekers',
        route: JobSeekerRoutes
    },
    {
        path: '/employers',
        route: EmployerRoutes
    },
    {
        path: '/auth',
        route: AuthRoutes
    },
];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;
