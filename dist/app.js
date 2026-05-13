"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const config_1 = __importDefault(require("./config"));
const routes_1 = __importDefault(require("./app/routes"));
const rateLimit_1 = require("./app/middlewares/rateLimit");
const securityHeaders_1 = require("./app/middlewares/securityHeaders");
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(securityHeaders_1.securityHeaders);
const allowedOrigins = new Set([
    config_1.default.frontend_url,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]);
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
//parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.send({
        message: "🌟💼 Welcome to I JOB Server! Your ultimate platform to find the best jobs in Bangladesh. 🚀 Ready to discover your next career opportunity? Start your search now! 🔍",
        environment: config_1.default.node_env,
        uptime: process.uptime().toFixed(2) + "sec",
        timeStamp: new Date().toUTCString()
    });
});
// Routes 
app.use('/api/v1/auth/verification', (0, rateLimit_1.rateLimit)({ windowMs: 15 * 60 * 1000, limit: 10 }));
app.use('/api/v1/auth', (0, rateLimit_1.rateLimit)({ windowMs: 15 * 60 * 1000, limit: 80 }));
app.use('/api/v1/users/register', (0, rateLimit_1.rateLimit)({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use('/api/v1', routes_1.default);
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
