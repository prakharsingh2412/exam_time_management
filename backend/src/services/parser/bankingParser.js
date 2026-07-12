import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class BankingParser extends BaseParser {
  confidence(text) {
    let score = 0;

    // Exam Names
    if (/IBPS/i.test(text)) score += 5;
    if (/SBI/i.test(text)) score += 5;
    if (/RBI/i.test(text)) score += 5;
    if (/RRB/i.test(text)) score += 5;

    // Banking Sections
    if (/Reasoning Ability/i.test(text)) score += 4;
    if (/Quantitative Aptitude/i.test(text)) score += 4;
    if (/English Language/i.test(text)) score += 4;
    if (/General Awareness/i.test(text)) score += 3;
    if (/Computer Knowledge/i.test(text)) score += 3;

    // Common Instructions
    if (/Negative Marking/i.test(text)) score += 5;
    if (/penalty/i.test(text)) score += 2;

    return Math.min(score / 20, 0.8);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }

  /**
   * Default exam settings
   * Used only if parser cannot extract values from the PDF instructions.
   */
  getDefaultExamConfig() {
    return {
      marksPerQuestion: 1,
      negativeMarking: true,
      negativeMarks: 0.25,
    };
  }
}

export default BankingParser;
