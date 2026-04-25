import { Request, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { JobSeekerService } from './jobSeeker.service';
import pick from '../../../shared/pick';
import { jobSeekerFilterableFields } from './jobSeeker.constant';

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, jobSeekerFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await JobSeekerService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job Seekers fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await JobSeekerService.getByIdFromDB(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job Seeker profile fetched successfully!",
    data: result,
  });
});

const updateIntoDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await JobSeekerService.updateIntoDB(id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job Seeker profile updated successfully!",
    data: result,
  });
});

const softDeleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await JobSeekerService.softDeleteFromDB(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job Seeker soft deleted successfully!",
    data: result,
  });
});

const hardDeleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await JobSeekerService.hardDeleteFromDB(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job Seeker permanently deleted!",
    data: result,
  });
});

export const JobSeekerController = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  softDeleteFromDB,
  hardDeleteFromDB,
};