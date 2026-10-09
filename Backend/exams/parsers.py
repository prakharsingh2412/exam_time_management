# exams/parsers.py
import re
import logging
import collections

import pdfplumber
from django.db import transaction

from .models import Question

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Regexes
# ─────────────────────────────────────────────────────────────

# Question starts: "1. …", "2.31 …", "3.Six …"
NUMBER_RE = re.compile(r"^\s*(\d{1,3})\.(?:\s+|(?=[A-Z0-9]))(.*)")

# Answer-key explanation lines: "1. (d) …"
ANSWER_KEY_LINE_RE = re.compile(r"^\s*\d{1,3}\.\s*\([a-dA-D]\)\s")

# Option markers: "(a)", "a)", "(a.", "a]"
OPTION_MARKER_RE = re.compile(r"\(?([a-dA-D])[).]\s*")


# ─────────────────────────────────────────────────────────────
# Extraction
# ─────────────────────────────────────────────────────────────

def _consume_options(line: str, q: dict) -> bool:
    parts = OPTION_MARKER_RE.split(line)
    found = False
    i = 1
    while i + 1 < len(parts):
        letter = parts[i].upper()
        body = parts[i + 1].strip()
        if letter in ("A", "B", "C", "D") and body:
            q["options"].setdefault(letter, body)
            found = True
        i += 2
    return found


def _extract_questions_from_text(text: str, max_number: int = 100) -> list[dict]:
    questions: list[dict] = []
    current: dict | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if ANSWER_KEY_LINE_RE.match(line):
            if current:
                questions.append(current)
                current = None
            continue

        m = NUMBER_RE.match(line)
        if m:
            n = int(m.group(1))
            if n < 1 or n > max_number:
                if current is not None and not current["options"]:
                    current["text"] += " " + line
                continue

            if current:
                questions.append(current)
            current = {
                "number": n,
                "text": m.group(2).strip(),
                "options": {},
            }
            _consume_options(line, current)
            continue

        if current is not None:
            if _consume_options(line, current):
                continue
            if not current["options"]:
                current["text"] += " " + line
            else:
                for letter in ("D", "C", "B", "A"):
                    if letter in current["options"]:
                        current["options"][letter] += " " + line
                        break

    if current:
        questions.append(current)
    return questions


# ─────────────────────────────────────────────────────────────
# Dynamic detection
# ─────────────────────────────────────────────────────────────

def _find_answer_key_start(pdf) -> int:
    """
    Return the 1-indexed page where the answer-key section starts,
    or len(pdf.pages)+1 if no answer-key page is found.

    Heuristic: answer-key pages contain several lines matching
    'N. (x) explanation'.
    """
    total = len(pdf.pages)
    for i, page in enumerate(pdf.pages, 1):
        try:
            text = page.extract_text() or ""
        except Exception:
            continue
        matches = re.findall(r"^\s*\d{1,3}\.\s*\([a-dA-D]\)\s", text, re.M)
        if len(matches) >= 5:
            return i
    return total + 1


def _guess_n_columns(page) -> int:
    """
    Look at word x-distribution and decide 1 / 2 / 3 columns.
    """
    words = page.extract_words()
    if not words:
        return 1

    w = page.width
    bins = collections.Counter(int(word["x0"] // 20) for word in words)

    # Look at the middle 80% of the page
    lo_bin = int(w * 0.10 / 20)
    hi_bin = int(w * 0.90 / 20)
    total_bins = max(1, hi_bin - lo_bin)
    non_empty = sum(1 for b in range(lo_bin, hi_bin) if bins.get(b, 0) > 0)
    density = non_empty / total_bins

    if density < 0.25:
        return 1
    if density < 0.55:
        return 2
    return 3


def _detect_column_splits(page, n_columns: int) -> list[float]:
    """
    Return n_columns-1 x-coordinates where columns separate.
    Falls back to even thirds if no clear gutters found.
    """
    w = page.width
    if n_columns == 1:
        return []

    words = page.extract_words()
    if not words:
        return [w * i / n_columns for i in range(1, n_columns)]

    bins = collections.Counter(int(word["x0"] // 20) for word in words)
    max_bin = int(w // 20)

    # Find runs of empty bins (potential gutters)
    runs: list[tuple[int, int]] = []
    start = None
    for b in range(1, max_bin):
        if bins.get(b, 0) == 0:
            if start is None:
                start = b
        else:
            if start is not None:
                runs.append((start, b - 1))
                start = None
    if start is not None:
        runs.append((start, max_bin))

    # Keep runs in the middle band of the page
    lo_cut = int(w * 0.15 / 20)
    hi_cut = int(w * 0.85 / 20)
    mid_runs = [(a, b) for (a, b) in runs if a >= lo_cut and b <= hi_cut]

    # Pick the widest n_columns-1 runs
    mid_runs.sort(key=lambda r: r[1] - r[0], reverse=True)
    chosen = sorted(mid_runs[: n_columns - 1])

    if len(chosen) < n_columns - 1:
        # Fallback: even split
        return [w * i / n_columns for i in range(1, n_columns)]

    return [((a + b) / 2.0) * 20 for (a, b) in chosen]


def _crop_columns(page, n_columns: int, top_skip: float = 0.0) -> list[str]:
    """
    Crop a page into n_columns vertical strips and return their text.
    top_skip is a fraction of page height to ignore at the top.
    """
    w, h = page.width, page.height
    top = h * top_skip
    splits = _detect_column_splits(page, n_columns)
    bounds = [0.0] + list(splits) + [w]

    cols: list[str] = []
    for i in range(n_columns):
        x0, x1 = bounds[i], bounds[i + 1]
        text = (page.crop((x0, top, x1, h)).extract_text() or "").strip()
        if text:
            cols.append(text)
    return cols


def _page_to_columns(page, page_num: int) -> list[str]:
    """
    Per-page column layout. Page 1 gets a special case only if it
    actually contains the INSTRUCTIONS header; otherwise it falls
    through to generic detection.
    """
    if page_num == 1:
        try:
            first_text = (page.extract_text() or "").upper()
        except Exception:
            first_text = ""
        if "INSTRUCTIONS" in first_text or "INSTRUCTION" in first_text:
            return _crop_columns(page, n_columns=2, top_skip=0.30)

    n = _guess_n_columns(page)
    return _crop_columns(page, n_columns=n)


# ─────────────────────────────────────────────────────────────
# Dedupe
# ─────────────────────────────────────────────────────────────

def _dedupe_by_number(parsed: list[dict], source: str) -> list[dict]:
    seen: set[int] = set()
    unique: list[dict] = []
    for q in parsed:
        n = q["number"]
        if n in seen:
            logger.warning("Duplicate question number %s in %s — skipping.", n, source)
            continue
        seen.add(n)
        unique.append(q)
    return unique


# ─────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────

def parse_test_pdf(test) -> None:
    test.parsing_status = "parsing"
    test.parsing_error = ""
    test.save(update_fields=["parsing_status", "parsing_error"])

    try:
        all_parsed: list[dict] = []
        max_n = test.total_questions or 100

        with pdfplumber.open(test.pdf.path) as pdf:
            answer_key_start = _find_answer_key_start(pdf)
            logger.info(
                "Answer key starts at page %s (of %s).",
                answer_key_start, len(pdf.pages),
            )

            for page_num, page in enumerate(pdf.pages, start=1):
                if page_num >= answer_key_start:
                    logger.info("Page %d is answer key — skipping.", page_num)
                    continue

                col_texts = _page_to_columns(page, page_num)
                logger.info("Page %d → %d column(s).", page_num, len(col_texts))

                for col_idx, col_text in enumerate(col_texts):
                    found = _extract_questions_from_text(col_text, max_n)
                    if found:
                        logger.info(
                            "Page %d col %d → %d questions (nums %s)",
                            page_num, col_idx, len(found),
                            [q["number"] for q in found],
                        )
                    all_parsed.extend(found)

        logger.info("Parsed %d raw questions from %s", len(all_parsed), test.pdf.name)
        unique_parsed = _dedupe_by_number(all_parsed, test.pdf.name)

        # Split kept / dropped, and log which ones got dropped
        kept: list[dict] = []
        dropped: list[dict] = []
        for q in unique_parsed:
            (kept if q["options"] else dropped).append(q)

        if dropped:
            logger.warning(
                "Dropped %d question(s) without options: %s",
                len(dropped),
                [q["number"] for q in dropped],
            )

        missing = [
            n for n in range(1, max_n + 1)
            if n not in {q["number"] for q in kept}
        ]
        if missing:
            logger.warning(
                "Missing question numbers after parse: %s",
                missing,
            )

        answer_key = test.answer_key or {}
        rows = [
            Question(
                test=test,
                number=q["number"],
                text=q["text"].strip(),
                option_a=q["options"].get("A", ""),
                option_b=q["options"].get("B", ""),
                option_c=q["options"].get("C", ""),
                option_d=q["options"].get("D", ""),
                correct=answer_key.get(str(q["number"]), "") or "",
            )
            for q in kept
        ]

        with transaction.atomic():
            Question.objects.filter(test=test).delete()
            Question.objects.bulk_create(rows, batch_size=200)

        # If we got everything, mark done. Otherwise, mark for review.
        if missing:
            test.parsing_status = "needs_review"
        else:
            test.parsing_status = "done"
        test.save(update_fields=["parsing_status"])

        from django.core.cache import cache
        cache.delete(f"test:{test.id}:exam-payload:v1")

    except Exception as e:
        logger.exception("PDF parsing failed for test %s", test.id)
        test.parsing_status = "failed"
        test.parsing_error = str(e)[:2000]
        test.save(update_fields=["parsing_status", "parsing_error"])
        raise


# ─────────────────────────────────────────────────────────────
# Answer-key extraction
# ─────────────────────────────────────────────────────────────

def extract_answer_key(pdf_path: str, total_questions: int) -> dict[str, str]:
    key: dict[str, str] = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = "\n".join((p.extract_text() or "") for p in pdf.pages)

        for m in re.finditer(r"\b(\d{1,3})\s*[.\-)]?\s*([A-D])\b", text):
            n = int(m.group(1))
            if 1 <= n <= total_questions:
                key.setdefault(str(n), m.group(2))
    except Exception:
        logger.exception("Answer-key extraction failed")
    return key