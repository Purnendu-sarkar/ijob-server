import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const rateLimit = (options: { windowMs: number; limit: number }) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
      return next(
        new ApiError(
          httpStatus.TOO_MANY_REQUESTS,
          "Too many requests. Please wait a bit and try again.",
        ),
      );
    }

    return next();
  };
};
