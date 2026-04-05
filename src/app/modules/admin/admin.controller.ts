import { Request, RequestHandler, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import { AdminService } from './admin.service';
import pick from '../../../shared/pick';
import { adminFilterableFields } from './admin.constant';


const getAllFromDB: RequestHandler = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, adminFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await AdminService.getAllFromDB(filters, options)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin data fetched!",
        meta: result.meta,
        data: result.data
    })
})

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.getByIdFromDB(id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin data fetched by id!",
        data: result
    });
})

const updateIntoDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.updateIntoDB(id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin data updated!",
        data: result
    })
})


export const AdminController = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
}