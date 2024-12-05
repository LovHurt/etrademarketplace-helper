import express from "express";
import dotenv from "dotenv";
import categoryRoutes from "./routes/categoryRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api", categoryRoutes);

export default app;
