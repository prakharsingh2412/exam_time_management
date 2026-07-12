import prisma from "../config/prisma.js";

// Create Result
export const createResultService = async (data) => {
  const {
    attemptId,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    score,
    percentage,
  } = data;

  if (!attemptId) {
    throw new Error("Attempt ID is required");
  }

  return prisma.result.create({
    data: {
      attemptId,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      skippedQuestions,
      score,
      percentage,
    },
  });
};

// Get Result By ID
export const getResultByIdService = async (id) => {
  const result = await prisma.result.findUnique({
    where: { id },
    include: {
      attempt: {
        include: {
          exam: true,
          user: true,
        },
      },
    },
  });

  if (!result) {
    throw new Error("Result not found");
  }

  return result;
};

// Get Results By User
export const getUserResultsService = async (userId) => {
  return prisma.result.findMany({
    where: {
      attempt: {
        userId,
      },
    },
    include: {
      attempt: {
        include: {
          exam: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Update Result
export const updateResultService = async (id, data) => {
  const result = await prisma.result.findUnique({
    where: { id },
  });

  if (!result) {
    throw new Error("Result not found");
  }

  return prisma.result.update({
    where: { id },
    data,
  });
};

// Delete Result
export const deleteResultService = async (id) => {
  const result = await prisma.result.findUnique({
    where: { id },
  });

  if (!result) {
    throw new Error("Result not found");
  }

  await prisma.result.delete({
    where: { id },
  });

  return {
    message: "Result deleted successfully",
  };
};