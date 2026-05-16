import jwt from "jsonwebtoken";

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

export default generateToken;
