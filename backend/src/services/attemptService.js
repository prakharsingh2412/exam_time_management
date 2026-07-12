import prisma from "../config/prisma.js";

// Start Attempt
export const startAttemptService = async (data) => {
  const {
    userId,
    examId,
  } = data;

  if (!userId || !examId) {
    throw new Error("Missing required fields");
  }

  return prisma.attempt.create({
    data: {
      userId,
      examId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });
};

// Get Attempt By ID
export const getAttemptByIdService = async (id) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      exam: true,
      user: true,
      answers: true,
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  return attempt;
};

// Get User Attempts
export const getUserAttemptsService = async (userId) => {
  return prisma.attempt.findMany({
    where: { userId },
    include: {
      exam: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Submit Attempt
export const submitAttemptService = async (
  id,
  score,
  obtainedMarks
) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  return prisma.attempt.update({
    where: { id },
    data: {
      score,
      obtainedMarks,
      status: "COMPLETED",
      submittedAt: new Date(),
    },
  });
};

// Delete Attempt
export const deleteAttemptService = async (id) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  await prisma.attempt.delete({
    where: { id },
  });

  return {
    message: "Attempt deleted successfully",
  };
};