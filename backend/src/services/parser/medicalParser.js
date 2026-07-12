import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class MedicalParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/NEET/i.test(text)) confidenceScore += 10;
    if (/National Eligibility cum Entrance Test/i.test(text)) confidenceScore += 10;

    if (/Physics/i.test(text)) confidenceScore += 2;
    if (/Chemistry/i.test(text)) confidenceScore += 2;
    if (/Biology/i.test(text)) confidenceScore += 2;
    if (/Botany/i.test(text)) confidenceScore += 2;
    if (/Zoology/i.test(text)) confidenceScore += 2;

    if (/MBBS/i.test(text)) confidenceScore += 4;
    if (/BDS/i.test(text)) confidenceScore += 4;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default MedicalParser;
