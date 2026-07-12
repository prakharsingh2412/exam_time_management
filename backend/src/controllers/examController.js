import {createExamService, getAllExamsService, getExamByIdService, updateExamService, deleteExamService} from "../services/examService.js";

export const createExam = async (req, res) => {
  try {
    const exam = await createExamService(req.body);

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await getAllExamsService();

    res.json({
      success: true,
      exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await getExamByIdService(req.params.id);

    res.json({
      success: true,
      exam,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await updateExamService(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      message: "Exam updated successfully",
      exam,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const result = await deleteExamService(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};