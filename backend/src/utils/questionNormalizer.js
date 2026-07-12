const OPTION_KEYS = ["A", "B", "C", "D"];

const stripOptionPrefix = (value = "", optionKey = "") => {
  const text = String(value).trim();
  if (!text) return "";

  const keyPattern = optionKey || "[A-D]";
  return text.replace(new RegExp(`^\\(?${keyPattern}\\)?[\\s.)-:]+`, "i"), "").trim();
};

const normalizeAnswer = (question, options) => {
  const rawAnswer =
    question.correctAns ??
    question.correctAnswer ??
    question.answer ??
    question.ans ??
    "";

  const answer = String(rawAnswer).trim();
  if (!answer) return "";

  const optionKeyMatch = answer.match(/[A-D]/i);
  if (optionKeyMatch) return optionKeyMatch[0].toUpperCase();

  const matchedOption = OPTION_KEYS.find(
    (key) => options[key] && options[key].toLowerCase() === answer.toLowerCase()
  );

  return matchedOption || answer;
};

const normalizeOptions = (question) => {
  const options = {
    A: question.optionA ?? question.a ?? "",
    B: question.optionB ?? question.b ?? "",
    C: question.optionC ?? question.c ?? "",
    D: question.optionD ?? question.d ?? "",
  };

  if (Array.isArray(question.options)) {
    for (const [index, option] of question.options.slice(0, 4).entries()) {
      const key = OPTION_KEYS[index];
      options[key] = option;
    }
  } else if (question.options && typeof question.options === "object") {
    for (const key of OPTION_KEYS) {
      options[key] =
        question.options[key] ??
        question.options[key.toLowerCase()] ??
        options[key];
    }
  }

  return OPTION_KEYS.reduce((normalized, key) => {
    normalized[key] = stripOptionPrefix(options[key], key);
    return normalized;
  }, {});
};

export const normalizeQuestion = (question = {}) => {
  const options = normalizeOptions(question);

  return {
    question: String(question.question ?? question.text ?? question.prompt ?? "").trim(),
    optionA: options.A,
    optionB: options.B,
    optionC: options.C,
    optionD: options.D,
    correctAns: normalizeAnswer(question, options),
    marks: Number.isFinite(Number(question.marks)) ? Number(question.marks) : 1,
  };
};

export const normalizeQuestions = (questions = []) => {
  if (!Array.isArray(questions)) {
    throw new Error("Parser output must be an array of questions");
  }

  return questions.map(normalizeQuestion);
};
