import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import { getResult } from "../controllers/resultController.js";

const router = Router();

// USER
router.get("/:attemptId", authMiddleware, getResult);

export default router;