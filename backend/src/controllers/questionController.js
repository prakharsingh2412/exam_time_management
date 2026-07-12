import {
  createQuestionService,
  getAllQuestionsService,
  getQuestionByIdService,
  getQuestionsByExamService,
  updateQuestionService,
  deleteQuestionService,
} from "../services/questionService.js";

export const createQuestion = async (req, res, next) => {
  try {
    const question = await createQuestionService(req.body);

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllQuestions = async (req, res, next) => {
  try {
    const questions = await getAllQuestionsService();

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req, res, next) => {
  try {
    const question = await getQuestionByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsByExam = async (req, res, next) => {
  try {
    const questions = await getQuestionsByExamService(req.params.examId);

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const question = await updateQuestionService(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const result = await deleteQuestionService(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};