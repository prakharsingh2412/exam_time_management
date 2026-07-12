import SSCParser from "./sscParser.js";
import BankingParser from "./bankingParser.js";
import MedicalParser from "./medicalParser.js";
import LawParser from "./lawParser.js";
import EngineeringParser from "./engineeringParser.js";
import TeachingParser from "./teachingParser.js";
import UPSCParser from "./upscParser.js";
import MBAParser from "./mbaParser.js";
import DefenceParser from "./defenceParser.js";
import RailwayParser from "./railwayParser.js";
import GenericParser from "./genericParser.js";

const parsers = [
    new SSCParser(),
    new BankingParser(),
    new MedicalParser(),
    new LawParser(),
    new EngineeringParser(),
    new TeachingParser(),
    new UPSCParser(),
    new MBAParser(),
    new DefenceParser(),
    new RailwayParser(),
    new GenericParser()
];


export const getParser = (text) => {
    const fallbackParser = parsers.find((parser) => parser instanceof GenericParser) || new GenericParser();
    let bestParser = null;
    let highest = 0;

    for (const parser of parsers) {
        if (parser instanceof GenericParser) continue;

        const score = Number(parser.confidence(text)) || 0;
        if (score > highest) {
            highest = score;
            bestParser = parser;
        }
    }

    return bestParser || fallbackParser;
};
