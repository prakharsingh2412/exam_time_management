import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class UPSCParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/Union Public Service Commission/i.test(text)) confidenceScore += 10;
    if (/\bUPSC\b/i.test(text)) confidenceScore += 8;

    if (/Civil Services Examination/i.test(text)) confidenceScore += 7;
    if (/IAS/i.test(text)) confidenceScore += 6;
    if (/IPS/i.test(text)) confidenceScore += 6;
    if (/IFS/i.test(text)) confidenceScore += 6;

    if (/Preliminary Examination/i.test(text)) confidenceScore += 4;
    if (/Main Examination/i.test(text)) confidenceScore += 4;

    if (/Engineering Services Examination/i.test(text)) confidenceScore += 5;
    if (/Combined Defence Services/i.test(text)) confidenceScore += 5;
    if (/National Defence Academy/i.test(text)) confidenceScore += 5;
    if (/CAPF/i.test(text)) confidenceScore += 5;
    if (/Indian Forest Service/i.test(text)) confidenceScore += 5;
    if (/Combined Medical Services/i.test(text)) confidenceScore += 5;

    return Math.min(confidenceScore / 20, 0.9);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default UPSCParser;
