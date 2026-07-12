import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { ROLES } from "../utils/constants.js";

import { createAttempt, getAllAttempts, getAttemptById, getUserAttempts, updateAttemptScore, deleteAttempt } from "../controllers/attemptController.js";

const router = Router();

// USER
router.post("/", authMiddleware, createAttempt);
router.get("/my-attempts", authMiddleware, getUserAttempts);
router.get("/:id", authMiddleware, getAttemptById);

// ADMIN
router.get("/", authMiddleware, roleMiddleware(ROLES.ADMIN), getAllAttempts);
router.put("/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), updateAttemptScore);
router.delete("/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), deleteAttempt);

export default router;