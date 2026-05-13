"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const enums_1 = require("../../../prisma/generated/client/enums");
const employer_controller_1 = require("./employer.controller");
const employer_validations_1 = require("./employer.validations");
const fileUploader_1 = require("../../../helpers/fileUploader");
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
router.patch("/me/company", (0, auth_1.default)(enums_1.UserRole.EMPLOYER), fileUploader_1.fileUploader.upload.fields([
    { name: "file", maxCount: 1 },
    { name: "logoFile", maxCount: 1 },
]), parseFormDataJson, (0, validateRequest_1.default)(employer_validations_1.employerValidationSchemas.updateMyCompanyProfile), employer_controller_1.EmployerController.updateMyCompanyProfile);
router.post("/me/verification-documents", (0, auth_1.default)(enums_1.UserRole.EMPLOYER), fileUploader_1.fileUploader.upload.fields([
    { name: "tradeLicenseFile", maxCount: 1 },
    { name: "nidFile", maxCount: 1 },
    { name: "tinFile", maxCount: 1 },
    { name: "binFile", maxCount: 1 },
    { name: "otherDocumentFile", maxCount: 1 },
]), parseFormDataJson, (0, validateRequest_1.default)(employer_validations_1.employerValidationSchemas.submitVerificationDocuments), employer_controller_1.EmployerController.submitVerificationDocuments);
router.get("/", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.getAllFromDB);
router.get("/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.getByIdFromDB);
router.patch("/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), (0, validateRequest_1.default)(employer_validations_1.employerValidationSchemas.updateEmployerProfile), employer_controller_1.EmployerController.updateIntoDB);
router.delete("/soft/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.softDeleteFromDB);
router.delete("/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.hardDeleteFromDB);
exports.EmployerRoutes = router;
