import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { JobService } from "./job.service";

const createJob = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await JobService.createJobIntoDB(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Job posted successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (_req: Request, res: Response) => {
  const result = await JobService.getAllFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Jobs fetched successfully!",
    data: result,
  });
});

export const JobController = {
  createJob,
  getAllFromDB,
};

