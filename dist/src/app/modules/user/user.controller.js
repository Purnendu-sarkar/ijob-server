import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { userService } from './user.service';
import { fileUploader } from '../../../helpers/fileUploader';
const createJobSeeker = catchAsync(async (req, res) => {
    console.log("DATA", req.body);
    // ── File upload ───────────────────────────────────────
    let profilePhotoUrl = null;
    if (req.file) {
        const uploaded = await fileUploader.uploadToCloudinary(req.file);
        profilePhotoUrl = uploaded?.secure_url;
    }
    // Merge file url into body
    const payload = {
        ...req.body,
        profilePhotoUrl: profilePhotoUrl || req.body.profilePhotoUrl,
    };
    const result = await userService.createJobSeeker(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Job Seeker account created successfully",
        data: result,
    });
});
const createEmployer = catchAsync(async (req, res) => {
    let logoUrl = null;
    if (req.file) {
        const uploaded = await fileUploader.uploadToCloudinary(req.file);
        logoUrl = uploaded?.secure_url;
    }
    const payload = {
        ...req.body,
        logoUrl: logoUrl || req.body.logoUrl,
    };
    const result = await userService.createEmployer(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Employer & Company account created successfully (pending verification)",
        data: result,
    });
});
export const userController = {
    createJobSeeker,
    createEmployer,
};
