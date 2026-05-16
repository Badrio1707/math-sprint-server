// src/routes/userProfileRoutes.js

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  saveUserProfile,
} from "../controllers/userProfileController.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/user-profile
 * Ambil profil user yang sedang login.
 */
router.get("/", getUserProfile);

/**
 * POST /api/user-profile
 * Simpan seluruh data profil user.
 */
router.post("/", saveUserProfile);

export default router;
