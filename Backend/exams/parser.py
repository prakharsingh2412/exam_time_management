import re
import pdfplumber


# Matches: "1. B", "1) B", "Q1 B", "1 - B", "1: B", "Question 12 A"
ANSWER_PATTERN = re.compile(
    r"(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[\.\)\:\-]?\s*([A-Da-d])\b"
)

# Detects the "Answer Key" section header
KEY_HEADER = re.compile(r"answer\s*key", re.IGNORECASE)


def extract_answer_key(pdf_path: str, total_questions: int) -> dict:
    """
    Best-effort extraction of {"1": "B", "2": "A", ...} from a PDF.

    Strategy:
      1. Extract all text with pdfplumber.
      2. If an "Answer Key" heading is found, restrict to the text after it.
      3. Regex out (number, letter) pairs within 1..total_questions.
      4. First occurrence of each question number wins.

    Returns {} if nothing found — caller should fall back to manual entry.
    """
    text_chunks = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_chunks.append(page_text)
    except Exception:
        return {}

    full_text = "\n".join(text_chunks)
    if not full_text.strip():
        return {}

    header_match = KEY_HEADER.search(full_text)
    if header_match:
        full_text = full_text[header_match.end():]

    key: dict[str, str] = {}
    for num_str, letter in ANSWER_PATTERN.findall(full_text):
        num = int(num_str)
        if 1 <= num <= total_questions:
            key.setdefault(str(num), letter.upper())

    return key