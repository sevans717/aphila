import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  meHandler,
  refreshHandler,
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", validateRequest({ body: registerSchema }), registerHandler);
router.post("/login", validateRequest({ body: loginSchema }), loginHandler);
router.get("/me", requireAuth, meHandler);
router.post("/refresh", refreshHandler);

export default router;
