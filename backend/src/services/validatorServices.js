export const validateQuestionsService = (questions) => {
  const validQuestions = [];
  const invalidQuestions = [];

  for (const question of questions) {
    const isValid =
      question.question &&
      question.optionA &&
      question.optionB &&
      question.optionC &&
      question.optionD;

    if (isValid) {
      validQuestions.push(question);
    } else {
      invalidQuestions.push(question);
    }
  }

  return {
    validQuestions,
    invalidQuestions,
    total: questions.length,
    valid: validQuestions.length,
    invalid: invalidQuestions.length,
  };
};