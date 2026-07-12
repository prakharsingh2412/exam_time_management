import { processUploadedPdfService } from "../services/processUploadService.js";
import {createUploadService, getUploadService} from "../services/uploadService.js";

export const uploadPdf = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new Error("No file uploaded");
        }

        const upload = await createUploadService(req.user.id, req.file);

        res.status(201).json({
            success: true,
            message: "PDF uploaded successfully",
            data: upload
        });
    }

    catch (error) {
        next(error);
    }
};

export const getUpload = async (req, res, next) => {
    try {
        const upload = await getUploadService(req.params.id);

        res.status(200).json({
            success: true,
            data: upload
        });
    }

    catch (error) {
        next(error);
    }
};

export const processUpload = async (req, res, next) => {
  try {
    const result = await processUploadedPdfService(req.params.id);

    res.status(200).json({
      success: true,
      message: "PDF processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};