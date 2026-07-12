import { Router } from "express";

import authRoutes from "./authRoutes.js";
import examRoutes from "./examRoutes.js";
import questionRoutes from "./questionRoutes.js";
import attemptRoutes from "./attemptRoutes.js";
import resultRoutes from "./resultRoutes.js";
import uploadRoutes from "./uploadRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/exams", examRoutes);
router.use("/questions", questionRoutes);
router.use("/attempts", attemptRoutes);
router.use("/results", resultRoutes);
router.use("/uploads", uploadRoutes);


export default router;