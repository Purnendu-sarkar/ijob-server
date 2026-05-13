import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../../config";
import ApiError from "../errors/ApiError";

const getPrismaConflictMessage = (target: unknown) => {
  if (Array.isArray(target)) {
    if (target.includes("email")) return "An account with this email already exists.";
    if (target.includes("phone")) return "An account with this phone number already exists.";
    if (target.includes("slug")) return "This company slug is already taken.";
  }

  return "Duplicate record found.";
};

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err?.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err?.message || "Something went wrong!";
  let errorDetails = err;

  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed";
    errorDetails = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = undefined;
  } else if (err?.code === "P2002") {
    statusCode = httpStatus.CONFLICT;
    message = getPrismaConflictMessage(err?.meta?.target);
    errorDetails = undefined;
  } else if (err?.code === "LIMIT_FILE_SIZE") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Uploaded file must be 5MB or smaller.";
    errorDetails = undefined;
  } else if (err?.name === "MulterError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = err.message || "File upload failed.";
    errorDetails = undefined;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: config.node_env === "development" ? errorDetails : undefined,
  });
};

export default globalErrorHandler;
