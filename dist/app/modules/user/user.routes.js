"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const fileUploader_1 = require("../../../helpers/fileUploader");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_validation_1 = require("./user.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
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
router.post("/create-admin", (0, auth_1.default)(enums_1.UserRole.ADMIN), fileUploader_1.fileUploader.upload.single("file"), parseFormDataJson, (0, validateRequest_1.default)(user_validation_1.userValidation.createAdmin), user_controller_1.userController.createAdmin);
// Public registration endpoints
router.post("/register/job-seeker", fileUploader_1.fileUploader.upload.fields([
    { name: "file", maxCount: 1 },
    { name: "profilePhotoFile", maxCount: 1 },
    { name: "resumeFile", maxCount: 1 },
]), parseFormDataJson, (0, validateRequest_1.default)(user_validation_1.userValidation.createJobSeeker), user_controller_1.userController.createJobSeeker);
router.post("/register/employer", fileUploader_1.fileUploader.upload.fields([
    { name: "file", maxCount: 1 },
    { name: "logoFile", maxCount: 1 },
    { name: "tradeLicenseFile", maxCount: 1 },
    { name: "nidFile", maxCount: 1 },
    { name: "tinFile", maxCount: 1 },
    { name: "binFile", maxCount: 1 },
    { name: "otherDocumentFile", maxCount: 1 },
]), parseFormDataJson, (0, validateRequest_1.default)(user_validation_1.userValidation.createEmployer), user_controller_1.userController.createEmployer);
exports.userRoutes = router;
