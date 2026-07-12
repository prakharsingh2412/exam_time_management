class BaseParser {
  parse(text) {
    throw new Error("parse() must be implemented");
  }

  confidence(text) {
    return 0;
  }
}

export default BaseParser;
