import { Router } from "express";

const router = Router();

// Placeholder for image processing routes
router.get("/", (req, res) => {
  res.json({ message: "Image processing service" });
});

export { router as imageRoutes };
