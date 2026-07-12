import { getResultService } from "../services/resultService.js";

export const getResult = async (req, res, next) => {
  try {
    const result = await getResultService(req.params.attemptId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};