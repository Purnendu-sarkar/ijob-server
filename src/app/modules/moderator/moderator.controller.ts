import { Request, RequestHandler, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { fileUploader } from '../../../helpers/fileUploader';
import { ModeratorService } from './moderator.service';
import pick from '../../../shared/pick';
import { moderatorFilterableFields } from './moderator.constant';

const createModerator: RequestHandler = catchAsync(async (req: Request, res: Response) => {
    let profilePhotoUrl: string | null = null;

    if (req.file) {
        const uploaded = await fileUploader.uploadToCloudinary(req.file);
        profilePhotoUrl = uploaded?.secure_url || null;
    }

    const payload = {
        ...req.body,
        profilePhotoUrl,
    };

    const result = await ModeratorService.createModerator(payload);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Moderator created successfully",
        data: result,
    });
});

const getAllFromDB: RequestHandler = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, moderatorFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await ModeratorService.getAllFromDB(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Moderators fetched successfully!",
        meta: result.meta,
        data: result.data
    });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ModeratorService.getByIdFromDB(id as string);
    console.log("Result", result)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Moderator data fetched by id!",
        data: result
    });
});

const updateIntoDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ModeratorService.updateIntoDB(id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Moderator updated successfully!",
        data: result
    });
});


export const ModeratorController = {
    createModerator,
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
};