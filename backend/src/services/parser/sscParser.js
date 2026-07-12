import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class SSCParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    // Organization
    if (/Staff Selection Commission/i.test(text)) confidenceScore += 10;
    if (/\bSSC\b/i.test(text)) confidenceScore += 8;

    // Exams
    if (/\bCGL\b/i.test(text)) confidenceScore += 6;
    if (/Combined Graduate Level/i.test(text)) confidenceScore += 6;

    if (/\bCHSL\b/i.test(text)) confidenceScore += 6;
    if (/Combined Higher Secondary/i.test(text)) confidenceScore += 6;

    if (/\bMTS\b/i.test(text)) confidenceScore += 5;
    if (/Multi Tasking Staff/i.test(text)) confidenceScore += 5;

    if (/GD Constable/i.test(text)) confidenceScore += 5;
    if (/CPO/i.test(text)) confidenceScore += 5;
    if (/JE Examination/i.test(text)) confidenceScore += 5;
    if (/Junior Engineer/i.test(text)) confidenceScore += 5;
    if (/Stenographer/i.test(text)) confidenceScore += 5;
    if (/Selection Post/i.test(text)) confidenceScore += 5;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default SSCParser;
