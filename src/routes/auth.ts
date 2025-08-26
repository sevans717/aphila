import { Router } from 'express';
import { loginHandler, registerHandler, meHandler } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.get('/me', requireAuth, meHandler);

export default router;
