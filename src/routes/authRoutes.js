import express from "express";
import {
  googleLogin,
  getProfile,
  loginWithDevice,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/google", googleLogin);
router.post("/device-login", loginWithDevice);

export default router;
