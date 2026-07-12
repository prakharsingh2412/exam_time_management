import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class TeachingParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/CTET/i.test(text)) confidenceScore += 10;
    if (/UPTET/i.test(text)) confidenceScore += 8;
    if (/REET/i.test(text)) confidenceScore += 8;
    if (/HTET/i.test(text)) confidenceScore += 8;
    if (/KVS/i.test(text)) confidenceScore += 6;
    if (/NVS/i.test(text)) confidenceScore += 6;
    if (/DSSSB/i.test(text)) confidenceScore += 6;

    if (/Child Development and Pedagogy/i.test(text)) confidenceScore += 4;
    if (/Pedagogy/i.test(text)) confidenceScore += 4;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default TeachingParser;
