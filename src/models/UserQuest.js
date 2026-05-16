import mongoose from "mongoose";

const userQuestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // satu user hanya memiliki satu dokumen quest
      index: true,
    },

    quests: {
      type: Array,
      required: true,
      default: [],
    },

    lastResetDate: {
      type: String, // format "YYYY-MM-DD"
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Hilangkan __v saat dikirim ke client
userQuestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const UserQuest = mongoose.model("UserQuest", userQuestSchema);

export default UserQuest;
