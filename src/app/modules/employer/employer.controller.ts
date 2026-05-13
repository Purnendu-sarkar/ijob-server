import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../../shared/pick";
import { employerFilterableFields } from "./employer.constant";
import { EmployerService } from "./employer.service";
import { fileUploader } from "../../../helpers/fileUploader";
import { VerificationDocumentType } from "../../../prisma/generated/client/client";

type MulterFileMap = Record<string, Express.Multer.File[]>;

const firstFile = (req: Request, ...fieldNames: string[]) => {
  const files = (req.files || {}) as MulterFileMap;
  for (const fieldName of fieldNames) {
    const file = files[fieldName]?.[0];
    if (file) return file;
  }
  return null;
};

const uploadFile = async (file: Express.Multer.File | null) => {
  if (!file) return null;
  const uploaded = await fileUploader.uploadToCloudinary(file);
  return {
    url: uploaded?.secure_url || null,
    publicId: uploaded?.public_id || null,
  };
};

const uploadVerificationDocuments = async (req: Request) => {
  const fields: Array<{ field: string; documentType: VerificationDocumentType }> = [
    { field: "tradeLicenseFile", documentType: VerificationDocumentType.TRADE_LICENSE },
    { field: "nidFile", documentType: VerificationDocumentType.NID },
    { field: "tinFile", documentType: VerificationDocumentType.TIN },
    { field: "binFile", documentType: VerificationDocumentType.BIN },
    { field: "otherDocumentFile", documentType: VerificationDocumentType.OTHER },
  ];

  const files = (req.files || {}) as MulterFileMap;
  const documents = [];

  for (const { field, documentType } of fields) {
    const file = files[field]?.[0];
    if (!file) continue;

    const uploaded = await uploadFile(file);
    if (!uploaded?.url) continue;

    documents.push({
      documentType,
      fileUrl: uploaded.url,
      filePublicId: uploaded.publicId,
    });
  }

  return documents;
};

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, employerFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await EmployerService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employers fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmployerService.getByIdFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employer fetched successfully!",
    data: result,
  });
});

const updateIntoDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmployerService.updateIntoDB(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employer profile updated successfully!",
    data: result,
  });
});

const updateMyCompanyProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const logo = await uploadFile(firstFile(req, "logoFile", "file"));
  const result = await EmployerService.updateMyCompanyProfile(req.user.userId, {
    ...req.body,
    ...(logo?.url ? { logoUrl: logo.url } : {}),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company profile updated successfully!",
    data: result,
  });
});

const submitVerificationDocuments = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const documents = await uploadVerificationDocuments(req);
  const result = await EmployerService.submitVerificationDocuments(req.user.userId, documents);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Verification documents submitted successfully!",
    data: result,
  });
});

const softDeleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmployerService.softDeleteFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employer soft deleted successfully!",
    data: result,
  });
});

const hardDeleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmployerService.hardDeleteFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employer permanently deleted!",
    data: result,
  });
});

export const EmployerController = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  updateMyCompanyProfile,
  submitVerificationDocuments,
  softDeleteFromDB,
  hardDeleteFromDB,
};
