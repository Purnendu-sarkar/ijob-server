"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminValidationSchemas = void 0;
const zod_1 = require("zod");
const update = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").optional(),
        phone: zod_1.z.string().min(1, "Contact number is required").optional(),
    }),
});
exports.adminValidationSchemas = { update };
