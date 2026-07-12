import {
  createAttemptService,
  getAllAttemptsService,
  getAttemptByIdService,
  getUserAttemptsService,
  updateAttemptScoreService,
  deleteAttemptService,
} from "../services/attemptService.js";

export const createAttempt = async (req, res, next) => {
  try {
    const attempt = await createAttemptService(req.body);

    res.status(201).json({
      success: true,
      message: "Attempt created successfully",
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAttempts = async (req, res, next) => {
  try {
    const attempts = await getAllAttemptsService();

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttemptById = async (req, res, next) => {
  try {
    const attempt = await getAttemptByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAttempts = async (req, res, next) => {
  try {
    const attempts = await getUserAttemptsService(req.user.id);

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAttemptScore = async (req, res, next) => {
  try {
    const attempt = await updateAttemptScoreService(
      req.params.id,
      req.body.score
    );

    res.status(200).json({
      success: true,
      message: "Score updated successfully",
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttempt = async (req, res, next) => {
  try {
    const result = await deleteAttemptService(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};