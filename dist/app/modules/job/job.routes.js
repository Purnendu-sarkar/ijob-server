"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const client_1 = require("../../../prisma/generated/client/client");
const job_controller_1 = require("./job.controller");
const job_validations_1 = require("./job.validations");
const router = express_1.default.Router();
router.get("/", job_controller_1.JobController.getAllFromDB);
router.post("/", (0, auth_1.default)(client_1.UserRole.EMPLOYER), (0, validateRequest_1.default)(job_validations_1.jobValidationSchemas.createJob), job_controller_1.JobController.createJob);
exports.JobRoutes = router;
