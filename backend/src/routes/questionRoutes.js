import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { ROLES } from "../utils/constants.js";

import { createQuestion, getAllQuestions, getQuestionById, getQuestionsByExam, updateQuestion, deleteQuestion } from "../controllers/questionController.js";

const router = Router();

// PUBLIC
router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);
router.get("/exam/:examId", getQuestionsByExam);

// ADMIN ONLY
router.post("/", authMiddleware, roleMiddleware(ROLES.ADMIN), createQuestion);
router.put("/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), updateQuestion);
router.delete("/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), deleteQuestion);

export default router;