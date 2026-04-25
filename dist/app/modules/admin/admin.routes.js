"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("./admin.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const enums_1 = require("../../../prisma/generated/client/enums");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const admin_validations_1 = require("./admin.validations");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(enums_1.UserRole.ADMIN), admin_controller_1.AdminController.getAllFromDB);
router.get('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), admin_controller_1.AdminController.getByIdFromDB);
router.patch('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), (0, validateRequest_1.default)(admin_validations_1.adminValidationSchemas.update), admin_controller_1.AdminController.updateIntoDB);
router.delete('/soft/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), admin_controller_1.AdminController.softDeleteFromDB);
router.delete('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), admin_controller_1.AdminController.deleteFromDB);
exports.AdminRoutes = router;
