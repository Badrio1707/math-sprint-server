import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* Currency                                                               */
    /* ---------------------------------------------------------------------- */
    coin: {
      type: Number,
      default: 0,
      min: 0,
    },

    holded_coin: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* Stats                                                                  */
    /* ---------------------------------------------------------------------- */
    iq: {
      type: Number,
      default: 0,
      min: 0,
    },

    contribute: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* Progression                                                            */
    /* ---------------------------------------------------------------------- */
    stage_level: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* ---------------------------------------------------------------------- */
    /* Daily Login                                                            */
    /* ---------------------------------------------------------------------- */
    daily_login: {
      streak: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Timestamp dalam miliseconds (Date.now())
      last_login: {
        type: Number,
        default: null,
      },

      claimed_today: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* Energy                                                                 */
    /* ---------------------------------------------------------------------- */
    energy: {
      current: {
        type: Number,
        default: 10,
        min: 0,
      },

      max: {
        type: Number,
        default: 10,
        min: 1,
      },

      // Timestamp dalam miliseconds (Date.now())
      last_recovery_at: {
        type: Number,
        default: null,
      },

      /* Reward Ads Limit */
      max_recovery: {
        type: Number,
        default: 5,
        min: 0,
      },

      recover_left: {
        type: Number,
        default: 5,
        min: 0,
      },

      // Format YYYY-MM-DD
      recovery_reset_date: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

/* -------------------------------------------------------------------------- */
/* Static Helpers                                                             */
/* -------------------------------------------------------------------------- */

userProfileSchema.statics.getDefaultData = function () {
  return {
    coin: 0,
    holded_coin: 0,
    iq: 0,
    contribute: 0,
    stage_level: 1,

    daily_login: {
      streak: 0,
      last_login: null,
      claimed_today: false,
    },

    energy: {
      current: 10,
      max: 10,
      last_recovery_at: null,
      max_recovery: 5,
      recover_left: 5,
      recovery_reset_date: null,
    },
  };
};

userProfileSchema.statics.findOrCreateByUser = async function (userId) {
  let profile = await this.findOne({ userId });

  if (!profile) {
    const defaults = this.getDefaultData();

    profile = await this.create({
      userId,
      ...defaults,
      energy: {
        ...defaults.energy,
        recovery_reset_date: new Date().toISOString().split("T")[0],
      },
    });
  }

  return profile;
};

/* -------------------------------------------------------------------------- */
/* Instance Methods                                                           */
/* -------------------------------------------------------------------------- */

// YYYY-MM-DD
userProfileSchema.methods.getTodayString = function () {
  return new Date().toISOString().split("T")[0];
};

/**
 * Reset reward ads recovery setiap pergantian hari.
 */
userProfileSchema.methods.resetDailyRecoveryIfNeeded = async function () {
  const today = this.getTodayString();

  if (this.energy.recovery_reset_date !== today) {
    this.energy.recover_left = this.energy.max_recovery;
    this.energy.recovery_reset_date = today;
    await this.save();
  }
};

/**
 * Auto recover energy setiap 1 jam.
 * Hanya sampai energy.max.
 * Jika current > max (karena reward ads), recovery berhenti.
 */
userProfileSchema.methods.regenerateEnergy = async function () {
  await this.resetDailyRecoveryIfNeeded();

  const baseMax = this.energy.max;

  // Jika energy penuh atau melebihi max, stop recovery
  if (this.energy.current >= baseMax) {
    if (this.energy.last_recovery_at !== null) {
      this.energy.last_recovery_at = null;
      await this.save();
    }

    return;
  }

  // Jika belum ada timestamp recovery, mulai sekarang
  if (!this.energy.last_recovery_at) {
    this.energy.last_recovery_at = Date.now();
    await this.save();
    return;
  }

  const RECOVERY_INTERVAL = 60 * 60 * 1000; // 1 jam
  const elapsed = Date.now() - this.energy.last_recovery_at;

  if (elapsed < RECOVERY_INTERVAL) {
    return;
  }

  const recovered = Math.floor(elapsed / RECOVERY_INTERVAL);

  const newCurrent = Math.min(this.energy.current + recovered, baseMax);

  this.energy.current = newCurrent;

  this.energy.last_recovery_at =
    newCurrent >= baseMax
      ? null
      : this.energy.last_recovery_at + recovered * RECOVERY_INTERVAL;

  await this.save();
};

/* -------------------------------------------------------------------------- */
/* JSON Output                                                                */
/* -------------------------------------------------------------------------- */

userProfileSchema.methods.toClient = function () {
  return {
    coin: this.coin,
    holded_coin: this.holded_coin,
    iq: this.iq,
    contribute: this.contribute,
    stage_level: this.stage_level,
    daily_login: this.daily_login,
    energy: this.energy,
    updated_at: this.updatedAt,
  };
};

userProfileSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

/* -------------------------------------------------------------------------- */
/* Index                                                                      */
/* -------------------------------------------------------------------------- */

userProfileSchema.index({ userId: 1 }, { unique: true });

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
