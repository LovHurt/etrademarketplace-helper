import express from "express";
import {
  fetchAllCategories,
  fetchCategories,
  fetchToken,
  saveCategoriesToFile,
} from "../controllers/categoryController";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const token = await fetchToken();
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : null;
    const categories = await fetchCategories(token, categoryId);
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/categories/all", async (req, res) => {
  try {
    const token = await fetchToken();

    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const allCategories = await fetchAllCategories(token, categoryId);
    saveCategoriesToFile(allCategories);

    res.status(200).json(allCategories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
