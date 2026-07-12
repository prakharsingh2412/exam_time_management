import {
  processUploadService,
  updateUploadStatusService,
} from "./uploadService.js";

import { processPdfService } from "./processPdfService.js";

import {
  createExamService,
} from "./examService.js";

import {
  createManyQuestionsService,
} from "./questionService.js";

export const processUploadedPdfService = async (uploadId) => {
  // 1. Fetch upload
  const upload = await processUploadService(uploadId);

  // 2. Extract + Parse + Validate
  const result = await processPdfService(upload.filePath);

  const { validQuestions } = result.validation;

  if (validQuestions.length === 0) {
    await updateUploadStatusService(uploadId, "FAILED");
    throw new Error("No valid questions found");
  }

  // 3. Create Exam
  const exam = await createExamService({
    title: upload.originalName,
    description: "Generated from uploaded PDF",
    duration: 60,
    totalMarks: validQuestions.length,
  });

  // 4. Save Questions
  await createManyQuestionsService(
    exam.id,
    validQuestions
  );

  // 5. Update Upload Status
  await updateUploadStatusService(uploadId, "COMPLETED");

  return {
    examId: exam.id,
    totalQuestions: validQuestions.length,
  };
};
