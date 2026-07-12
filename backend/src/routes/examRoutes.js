import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { ROLES } from "../utils/constants.js";

import { createExam, getAllExams, getExamById, updateExam, deleteExam } from "../controllers/examController.js";

const router = Router();

// PUBLIC
router.get("/", getAllExams);
router.get("/:id", getExamById);

// ADMIN ONLY
router.post("/", authMiddleware, roleMiddleware(ROLES.ADMIN), createExam );
router.put("/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), updateExam);
router.delete( "/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), deleteExam);

export default router;