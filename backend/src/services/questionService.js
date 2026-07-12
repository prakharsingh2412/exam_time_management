import prisma from "../config/prisma.js";

// Create Question
export const createQuestionService = async (data) => {
  const {
    examId,
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAns,
    marks,
  } = data;

  if (
    !examId ||
    !question ||
    !optionA ||
    !optionB ||
    !optionC ||
    !optionD ||
    !correctAns
  ) {
    throw new Error("Missing required fields");
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  return prisma.question.create({
    data: {
      examId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAns,
      marks: marks || 1,
    },
  });
};

// Get All Questions
export const getAllQuestionsService = async () => {
  return prisma.question.findMany({
    include: {
      exam: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

// Get Questions By Exam
export const getQuestionsByExamService = async (examId) => {
  return prisma.question.findMany({
    where: { examId },
    orderBy: {
      createdAt: "asc",
    },
  });
};

// Get Question By ID
export const getQuestionByIdService = async (id) => {
  const question = await prisma.question.findUnique({
    where: { id },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
};

// Update Question
export const updateQuestionService = async (id, data) => {
  const question = await prisma.question.findUnique({
    where: { id },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return prisma.question.update({
    where: { id },
    data,
  });
};

// Delete Question
export const deleteQuestionService = async (id) => {
  const question = await prisma.question.findUnique({
    where: { id },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  await prisma.question.delete({
    where: { id },
  });

  return {
    message: "Question deleted successfully",
  };
}; 

export const createManyQuestionsService = async (
  examId,
  questions
) => {
  return prisma.question.createMany({
    data: questions.map((question) => ({
      examId,
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAns: question.correctAns,
      marks: question.marks,
    })),
  });
};