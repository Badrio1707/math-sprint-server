import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { verifyGoogleToken } from "../services/googleService.js";

async function googleLogin(req, res) {
  try {
    const { id_token, device_id } = req.body || {};

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id is required",
      });
    }

    if (!id_token) {
      return res.status(400).json({
        success: false,
        message: "id_token is required",
      });
    }

    const googleUser = await verifyGoogleToken(id_token);

    let user = await User.findOne({
      email: googleUser.email,
    });

    if (!Array.isArray(user.deviceIds)) {
      user.deviceIds = [];
    }

    if (user) {
      user.name = googleUser.name;
      user.googleId = googleUser.googleId;
      user.avatar = googleUser.avatar;
      user.emailVerified = googleUser.emailVerified;
      user.lastLoginAt = new Date();

      if (!user.deviceIds) {
        user.deviceIds = [];
      }

      if (!user.deviceIds.includes(device_id)) {
        user.deviceIds.push(device_id);
      }

      await user.save();
    } else {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.avatar,
        emailVerified: googleUser.emailVerified,
        deviceIds: [device_id],
        lastLoginAt: new Date(),
      });
    }

    const token = generateToken(user._id.toString());

    return res.json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
}

async function loginWithDevice(req, res) {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id is required",
      });
    }

    const user = await User.findOne({
      deviceIds: { $in: [device_id] },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account linked to this device",
      });
    }

    const token = generateToken(user._id.toString());

    return res.json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error("Device login error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export { googleLogin, loginWithDevice };
