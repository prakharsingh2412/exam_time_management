import fs from "fs";
import { PDFParse } from "pdf-parse";

/**
 * Extract text from a PDF file
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export const extractPdfTextService = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("PDF file not found");
  }

  let parser;

  try {
    const buffer = fs.readFileSync(filePath);

    parser = new PDFParse({ data: buffer });
    const data = await parser.getText();

    if (!data.text || data.text.trim() === "") {
      throw new Error("No text found inside PDF");
    }

    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  } finally {
    await parser?.destroy();
  }
};

