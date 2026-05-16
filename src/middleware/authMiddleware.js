import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Ambil token dari header:
    // Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Jika token tidak ada
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token not provided",
      });
    }

    // Verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user dari database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // Simpan user ke request agar bisa digunakan controller
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
};

export default authMiddleware;
