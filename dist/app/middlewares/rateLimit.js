"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const buckets = new Map();
const rateLimit = (options) => {
    return (req, res, next) => {
        const now = Date.now();
        const key = `${req.ip}:${req.method}:${req.path}`;
        const bucket = buckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            buckets.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            return next();
        }
        bucket.count += 1;
        if (bucket.count > options.limit) {
            return next(new ApiError_1.default(http_status_1.default.TOO_MANY_REQUESTS, "Too many requests. Please wait a bit and try again."));
        }
        return next();
    };
};
exports.rateLimit = rateLimit;
