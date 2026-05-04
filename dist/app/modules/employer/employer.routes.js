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
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.getAllFromDB);
router.get("/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.getByIdFromDB);
router.patch("/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), (0, validateRequest_1.default)(employer_validations_1.employerValidationSchemas.updateEmployerProfile), employer_controller_1.EmployerController.updateIntoDB);
router.delete("/soft/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.softDeleteFromDB);
router.delete("/:id", (0, auth_1.default)(enums_1.UserRole.ADMIN), employer_controller_1.EmployerController.hardDeleteFromDB);
exports.EmployerRoutes = router;
