import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getUserQuests,
  saveUserQuests,
} from "../controllers/questController.js";

const router = express.Router();

// Semua route quest wajib login
router.use(authMiddleware);

// GET /api/user/quests
router.get("/quests", getUserQuests);

// POST /api/user/quests
router.post("/quests", saveUserQuests);

export default router;
