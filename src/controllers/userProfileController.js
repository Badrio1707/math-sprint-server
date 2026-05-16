// src/controllers/userProfileController.js

import UserProfile from "../models/UserProfile.js";

const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

const sanitizeProfileData = (data = {}) => ({
  coin: Number(data.coin) || 0,
  holded_coin: Number(data.holded_coin) || 0,
  iq: Number(data.iq) || 0,
  contribute: Number(data.contribute) || 0,
  stage_level: Math.max(Number(data.stage_level) || 1, 1),

  daily_login: {
    streak: Number(data.daily_login?.streak) || 0,
    last_login: data.daily_login?.last_login ?? null,
    claimed_today: Boolean(data.daily_login?.claimed_today),
  },

  energy: {
    current: Number(data.energy?.current) || 10,
    max: Math.max(Number(data.energy?.max) || 10, 1),
    last_recovery_at: data.energy?.last_recovery_at ?? null,
    max_recovery: Number(data.energy?.max_recovery) || 5,
    recover_left:
      data.energy?.recover_left != null ? Number(data.energy.recover_left) : 5,
    recovery_reset_date: data.energy?.recovery_reset_date ?? getTodayString(),
  },
});

/**
 * GET /api/user-profile
 */
export const getUserProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOrCreateByUser(req.user._id);

    await profile.regenerateEnergy();

    // Reload document terbaru dari database
    profile = await UserProfile.findById(profile._id);

    return res.json({
      success: true,
      data: profile.toClient(),
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/user-profile
 */
export const saveUserProfile = async (req, res) => {
  try {
    const incomingData = sanitizeProfileData(req.body || {});

    let profile = await UserProfile.findOrCreateByUser(req.user._id);

    // Update field top-level sesuai schema
    Object.assign(profile, incomingData);

    // Jalankan auto energy recovery
    await profile.regenerateEnergy();

    // Simpan
    await profile.save();

    // Reload document terbaru
    profile = await UserProfile.findById(profile._id);

    return res.json({
      success: true,
      message: "User profile saved successfully.",
      data: profile.toClient(),
    });
  } catch (error) {
    console.error("Save user profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      details: error.errors || null,
    });
  }
};
