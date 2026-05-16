import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import questRoutes from "./routes/questRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Math Sprint API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", questRoutes);
app.use("/api/user-profile", userProfileRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
