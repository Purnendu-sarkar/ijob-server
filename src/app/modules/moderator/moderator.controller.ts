import { Request, RequestHandler, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { fileUploader } from '../../../helpers/fileUploader';
import { ModeratorService } from './moderator.service';

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

export const ModeratorController = {
    createModerator,
};