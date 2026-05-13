"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSeekerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const fileUploader_1 = require("../../../helpers/fileUploader");
const jobSeeker_controller_1 = require("./jobSeeker.controller");
const jobSeeker_validation_1 = require("./jobSeeker.validation");
const enums_1 = require("../../../prisma/generated/client/enums");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const router = express_1.default.Router();
const parseFormDataJson = (req, res, next) => {
    try {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    }
    catch {
        next(new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid multipart data payload."));
    }
};
router.patch('/me/profile', (0, auth_1.default)(enums_1.UserRole.JOB_SEEKER), fileUploader_1.fileUploader.upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'profilePhotoFile', maxCount: 1 },
    { name: 'resumeFile', maxCount: 1 },
]), parseFormDataJson, (0, validateRequest_1.default)(jobSeeker_validation_1.jobSeekerValidationSchemas.updateMyJobSeekerProfile), jobSeeker_controller_1.JobSeekerController.updateMyProfile);
// Admin + Moderator can view all / single seeker
router.get('/', (0, auth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.MODERATOR), jobSeeker_controller_1.JobSeekerController.getAllFromDB);
router.get('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.MODERATOR), jobSeeker_controller_1.JobSeekerController.getByIdFromDB);
// Update - Admin & Moderator both can update (or only Admin depending on policy)
router.patch('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.MODERATOR), (0, validateRequest_1.default)(jobSeeker_validation_1.jobSeekerValidationSchemas.updateJobSeekerProfile), jobSeeker_controller_1.JobSeekerController.updateIntoDB);
// Soft Delete - Both Admin & Moderator
router.delete('/soft/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.MODERATOR), jobSeeker_controller_1.JobSeekerController.softDeleteFromDB);
// Hard Delete - Only Admin
router.delete('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), jobSeeker_controller_1.JobSeekerController.hardDeleteFromDB);
exports.JobSeekerRoutes = router;
