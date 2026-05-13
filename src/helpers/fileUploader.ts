import fs from "fs";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import httpStatus from "http-status";
import config from "../config";
import ApiError from "../app/errors/ApiError";

const uploadDir = path.join(process.cwd(), "uploads");

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 60);

    cb(null, `${safeBase || "upload"}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

async function uploadToCloudinary(file: Express.Multer.File) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
  });

  try {
    return await cloudinary.uploader.upload(file.path, {
      public_id: `${path.parse(file.filename).name}`,
      folder: "ijob_project",
      resource_type: "auto",
    });
  } finally {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new ApiError(httpStatus.BAD_REQUEST, "Only JPG, PNG, WEBP, and PDF files are allowed."));
      return;
    }

    cb(null, true);
  },
});

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
