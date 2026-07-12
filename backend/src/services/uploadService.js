import prisma from "../config/prisma.js";

export const createUploadService = async (userId, file) => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  return prisma.upload.create({
    data: {
      userId,
      originalName: file.originalname,
      storedName: file.filename,
      filePath: file.path,
      status: "PROCESSING",
    },
  });
};

export const getUploadByIdService = async (id) => {
  const upload = await prisma.upload.findUnique({
    where: { id },
    include: {
      exams: true,
    },
  });

  if (!upload) {
    throw new Error("Upload not found");
  }

  return upload;
};

export const updateUploadStatusService = async (id, status) => {
  return prisma.upload.update({
    where: { id },
    data: {
      status,
    },
  });
};

export const deleteUploadService = async (id) => {
  const upload = await prisma.upload.findUnique({
    where: { id },
  });

  if (!upload) {
    throw new Error("Upload not found");
  }

  await prisma.upload.delete({
    where: { id },
  });

  return {
    message: "Upload deleted successfully",
  };
};

export const processUploadService = async (uploadId) => {
  const upload = await prisma.upload.findUnique({
    where: {
      id: uploadId,
    },
  });

  if (!upload) {
    throw new Error("Upload not found");
  }

  return upload;
};