import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class EngineeringParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/JEE Main/i.test(text)) confidenceScore += 10;
    if (/JEE Advanced/i.test(text)) confidenceScore += 10;
    if (/BITSAT/i.test(text)) confidenceScore += 8;
    if (/VITEEE/i.test(text)) confidenceScore += 8;
    if (/WBJEE/i.test(text)) confidenceScore += 8;
    if (/MHT CET/i.test(text)) confidenceScore += 8;
    if (/COMEDK/i.test(text)) confidenceScore += 8;

    if (/Mathematics/i.test(text)) confidenceScore += 2;
    if (/Physics/i.test(text)) confidenceScore += 2;
    if (/Chemistry/i.test(text)) confidenceScore += 2;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default EngineeringParser;
