import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class MBAParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/CAT/i.test(text)) confidenceScore += 10;
    if (/XAT/i.test(text)) confidenceScore += 8;
    if (/MAT/i.test(text)) confidenceScore += 8;
    if (/CMAT/i.test(text)) confidenceScore += 8;
    if (/SNAP/i.test(text)) confidenceScore += 8;
    if (/NMAT/i.test(text)) confidenceScore += 8;
    if (/IIFT/i.test(text)) confidenceScore += 8;

    if (/Data Interpretation/i.test(text)) confidenceScore += 3;
    if (/Logical Reasoning/i.test(text)) confidenceScore += 3;
    if (/Verbal Ability/i.test(text)) confidenceScore += 3;
    if (/Reading Comprehension/i.test(text)) confidenceScore += 3;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default MBAParser;
