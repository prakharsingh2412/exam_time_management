import { extractPdfTextService } from "./pdfService.js";
import { parseQuestionsService } from "./questionParser.service.js";
import { validateQuestionsService } from "./validatorServices.js";

export const processPdfService = async (filePath) => {
  const text = await extractPdfTextService(filePath);

  const parsedQuestions = parseQuestionsService(text);

  const validation = validateQuestionsService(parsedQuestions);

  return {
    text,
    parsedQuestions,
    validation,
  };
};
