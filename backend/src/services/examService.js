import prisma from "../config/prisma.js";

export const createExamService = async (data) => {
  const { title, description, duration, totalMarks } = data;

  if (!title || !duration || !totalMarks) {
    throw new Error("Missing required fields");
  }

  return prisma.exam.create({
    data: {
      title,
      description,
      duration,
      totalMarks,
    },
  });
};

export const getAllExamsService = async () => {
  return prisma.exam.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      totalMarks: true,
      createdAt: true,
    },
  });
};

export const getExamByIdService = async (id) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          marks: true,
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  return exam;
};

export const updateExamService = async (id, data) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  return prisma.exam.update({
    where: { id },
    data,
  });
};

export const deleteExamService = async (id) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  await prisma.exam.delete({
    where: { id },
  });

  return { message: "Exam deleted successfully" };
};