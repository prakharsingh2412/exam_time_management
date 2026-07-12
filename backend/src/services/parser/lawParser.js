import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class LawParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/CLAT/i.test(text)) confidenceScore += 10;
    if (/Common Law Admission Test/i.test(text)) confidenceScore += 10;

    if (/AILET/i.test(text)) confidenceScore += 8;
    if (/SLAT/i.test(text)) confidenceScore += 8;

    if (/Legal Reasoning/i.test(text)) confidenceScore += 4;
    if (/Legal Aptitude/i.test(text)) confidenceScore += 4;
    if (/Constitution/i.test(text)) confidenceScore += 2;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default LawParser;
