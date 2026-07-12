import BaseParser from "./baseParser.js";
import { parseGenericQuestions } from "./genericParser.js";

class RailwayParser extends BaseParser {
  confidence(text) {
    let confidenceScore = 0;

    if (/Railway Recruitment Board/i.test(text)) confidenceScore += 10;
    if (/\bRRB\b/i.test(text)) confidenceScore += 8;

    if (/NTPC/i.test(text)) confidenceScore += 6;
    if (/Group D/i.test(text)) confidenceScore += 6;
    if (/Assistant Loco Pilot/i.test(text)) confidenceScore += 6;
    if (/\bALP\b/i.test(text)) confidenceScore += 6;
    if (/Technician/i.test(text)) confidenceScore += 5;
    if (/Junior Engineer/i.test(text)) confidenceScore += 5;
    if (/Railway Protection Force/i.test(text)) confidenceScore += 5;
    if (/\bRPF\b/i.test(text)) confidenceScore += 5;

    return Math.min(confidenceScore / 20, 0.85);
  }

  parse(text) {
    return parseGenericQuestions(text);
  }
}

export default RailwayParser;
