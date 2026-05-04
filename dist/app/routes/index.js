"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("../modules/user/user.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const admin_routes_1 = require("../modules/admin/admin.routes");
const moderator_routes_1 = require("../modules/moderator/moderator.routes");
const jobSeeker_routes_1 = require("../modules/jobSeeker/jobSeeker.routes");
const employer_routes_1 = require("../modules/employer/employer.routes");
const job_routes_1 = require("../modules/job/job.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/users',
        route: user_routes_1.userRoutes
    },
    {
        path: '/admin',
        route: admin_routes_1.AdminRoutes
    },
    {
        path: '/moderators',
        route: moderator_routes_1.ModeratorRoutes
    },
    {
        path: '/job-seekers',
        route: jobSeeker_routes_1.JobSeekerRoutes
    },
    {
        path: '/employers',
        route: employer_routes_1.EmployerRoutes
    },
    {
        path: '/jobs',
        route: job_routes_1.JobRoutes
    },
    {
        path: '/auth',
        route: auth_routes_1.AuthRoutes
    },
];
moduleRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
