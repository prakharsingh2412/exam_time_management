import BaseParser from "./baseParser.js";

export const parseGenericQuestions = (text) => {
  const lines = String(text)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const questions = [];

  let current = null;

  for (const line of lines) {
    if (/^\d+[.)]\s+/.test(line)) {
      if (current) {
        questions.push(current);
      }

      current = {
        question: line.replace(/^\d+[.)]\s*/, ""),
        options: [],
        answer: "",
        marks: 1,
      };

      continue;
    }

    if (/^\(?[A-D]\)?[.)]\s+/i.test(line)) {
      current?.options.push(line);
      continue;
    }

    if (/^(Answer|Ans\.?|Correct Answer)\s*[:\-]?\s*/i.test(line)) {
      if (current) {
        current.answer = line.replace(/^(Answer|Ans\.?|Correct Answer)\s*[:\-]?\s*/i, "");
      }
      continue;
    }

    if (current) {
      current.question += " " + line;
    }
  }

  if (current) {
    questions.push(current);
  }

  return questions;
};

class GenericParser extends BaseParser {
  confidence(text) {
    return String(text || "").trim() ? 0.3 : 0;
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default GenericParser;
