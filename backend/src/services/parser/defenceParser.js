import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class DefenceParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/NDA/i.test(text)) confidenceScore += 8;
    if (/National Defence Academy/i.test(text)) confidenceScore += 8;

    if (/CDS/i.test(text)) confidenceScore += 8;
    if (/Combined Defence Services/i.test(text)) confidenceScore += 8;

    if (/AFCAT/i.test(text)) confidenceScore += 8;
    if (/Air Force Common Admission Test/i.test(text)) confidenceScore += 8;

    if (/Indian Army/i.test(text)) confidenceScore += 5;
    if (/Indian Navy/i.test(text)) confidenceScore += 5;
    if (/Indian Air Force/i.test(text)) confidenceScore += 5;
    if (/Agniveer/i.test(text)) confidenceScore += 5;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default DefenceParser;
