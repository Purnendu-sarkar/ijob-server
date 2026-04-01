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
const router = express_1.default.Router();
// Public registration endpoints
router.post("/register/job-seeker", fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    // Parse JSON string if sent as form-data
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    next();
}, (0, validateRequest_1.default)(user_validation_1.userValidation.createJobSeeker), user_controller_1.userController.createJobSeeker);
router.post("/register/employer", fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    next();
}, (0, validateRequest_1.default)(user_validation_1.userValidation.createEmployer), user_controller_1.userController.createEmployer);
exports.userRoutes = router;
