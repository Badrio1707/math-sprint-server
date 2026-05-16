import UserQuest from "../models/UserQuest.js";

/**
 * GET /api/user/quests
 */
export const getUserQuests = async (req, res) => {
  try {
    const record = await UserQuest.findOne({
      userId: req.user._id,
    });

    if (!record) {
      return res.json({
        quests: null,
        last_reset_date: null,
      });
    }

    return res.json({
      quests: record.quests,
      last_reset_date: record.lastResetDate,
    });
  } catch (error) {
    console.error("Get quests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load quests",
    });
  }
};

/**
 * POST /api/user/quests
 */
export const saveUserQuests = async (req, res) => {
  try {
    const { quests, last_reset_date = null } = req.body || {};

    // Validasi sederhana
    if (!Array.isArray(quests)) {
      return res.status(400).json({
        success: false,
        message: "quests must be an array",
      });
    }

    // Setara Laravel updateOrCreate()
    const record = await UserQuest.findOneAndUpdate(
      {
        userId: req.user._id,
      },
      {
        quests,
        lastResetDate: last_reset_date,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Save quests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save quests",
    });
  }
};
