import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { jobFilterableFields } from "./job.constant";
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

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, jobFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await JobService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Jobs fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

export const JobController = {
  createJob,
  getAllFromDB,
};
