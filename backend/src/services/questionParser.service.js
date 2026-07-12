import { getParser } from "./parser/parserFactory.js";
import { normalizeQuestions } from "../utils/questionNormalizer.js";

export const parseQuestionsService = (text) => {
  if (!text || !String(text).trim()) {
    throw new Error("Empty PDF text");
  }

  const parser = getParser(text);
  const questions = parser.parse(text);

  return normalizeQuestions(questions);
};
