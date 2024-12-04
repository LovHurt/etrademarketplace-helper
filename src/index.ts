import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config(); // .env dosyasını yükler

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basit bir rota
app.get("/", (req: Request, res: Response) => {
  res.send("Node.js + TypeScript Projemiz Başladı!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
