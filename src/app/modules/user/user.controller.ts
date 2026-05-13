import { Request, Response } from "express";
import httpStatus from "http-status";
import { VerificationDocumentType } from "../../../prisma/generated/client/client";
import { fileUploader } from "../../../helpers/fileUploader";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.service";

type MulterFileMap = Record<string, Express.Multer.File[]>;

const getFiles = (req: Request) => (req.files || {}) as MulterFileMap;

const firstFile = (req: Request, ...fieldNames: string[]) => {
  const files = getFiles(req);
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
  const documentFields: Array<{
    field: string;
    documentType: VerificationDocumentType;
  }> = [
    { field: "tradeLicenseFile", documentType: VerificationDocumentType.TRADE_LICENSE },
    { field: "nidFile", documentType: VerificationDocumentType.NID },
    { field: "tinFile", documentType: VerificationDocumentType.TIN },
    { field: "binFile", documentType: VerificationDocumentType.BIN },
    { field: "otherDocumentFile", documentType: VerificationDocumentType.OTHER },
  ];

  const files = getFiles(req);
  const documents = [];

  for (const { field, documentType } of documentFields) {
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

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  let profilePhotoUrl: string | null = null;

  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);
    profilePhotoUrl = uploaded?.secure_url || null;
  }

  const result = await userService.createAdmin({
    ...req.body,
    profilePhotoUrl,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const createJobSeeker = catchAsync(async (req: Request, res: Response) => {
  const profilePhoto = await uploadFile(firstFile(req, "profilePhotoFile", "file"));
  const resume = await uploadFile(firstFile(req, "resumeFile"));

  const result = await userService.createJobSeeker({
    ...req.body,
    profilePhotoUrl: profilePhoto?.url || req.body.profilePhotoUrl,
    resumeUrl: resume?.url || req.body.resumeUrl,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Job seeker account created successfully",
    data: result,
  });
});

const createEmployer = catchAsync(async (req: Request, res: Response) => {
  const logo = await uploadFile(firstFile(req, "logoFile", "file"));
  const verificationDocuments = await uploadVerificationDocuments(req);

  const result = await userService.createEmployer({
    ...req.body,
    logoUrl: logo?.url || req.body.logoUrl,
    verificationDocuments,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Employer and company account created successfully. Verification is pending.",
    data: result,
  });
});

export const userController = {
  createJobSeeker,
  createEmployer,
  createAdmin,
};
