import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { processUpload, getUpload, uploadPdf} from "../controllers/uploadController.js";

const router = Router();


router.post("/", authMiddleware, upload.single("pdf"), uploadPdf);
router.get( "/:id",authMiddleware, getUpload);
router.post("/:id/process", authMiddleware, processUpload );

export default router;