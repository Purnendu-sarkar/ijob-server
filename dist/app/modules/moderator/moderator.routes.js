"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const enums_1 = require("../../../prisma/generated/client/enums");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const moderator_validations_1 = require("./moderator.validations");
const fileUploader_1 = require("../../../helpers/fileUploader");
const moderator_controller_1 = require("./moderator.controller");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(enums_1.UserRole.ADMIN), // Only Admin can see all moderators
moderator_controller_1.ModeratorController.getAllFromDB);
router.get('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), moderator_controller_1.ModeratorController.getByIdFromDB);
router.post('/create-moderator', (0, auth_1.default)(enums_1.UserRole.ADMIN), fileUploader_1.fileUploader.upload.single("file"), // profile photo optional
(req, res, next) => {
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    next();
}, (0, validateRequest_1.default)(moderator_validations_1.moderatorValidationSchemas.createModerator), moderator_controller_1.ModeratorController.createModerator);
router.patch('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), (0, validateRequest_1.default)(moderator_validations_1.moderatorValidationSchemas.updateModerator), moderator_controller_1.ModeratorController.updateIntoDB);
router.delete('/soft/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), moderator_controller_1.ModeratorController.softDeleteFromDB);
router.delete('/:id', (0, auth_1.default)(enums_1.UserRole.ADMIN), moderator_controller_1.ModeratorController.deleteFromDB);
exports.ModeratorRoutes = router;
