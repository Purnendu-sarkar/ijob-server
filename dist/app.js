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
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: ['*', 'http://localhost:3000'],
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
app.use('/api/v1', routes_1.default);
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
