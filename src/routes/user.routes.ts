import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { updateProfileSchema } from "../schemas/user.schema";
import { updateUserProfile } from "../services/user.service";

const router = Router();

// PATCH /user - update profile (requires auth)
router.patch(
  "/",
  requireAuth,
  validateBody(updateProfileSchema),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const data = req.body;
      const profile = await updateUserProfile(userId, data);
      res.json({ success: true, data: profile });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

export default router;
