import { z } from 'zod';
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
const loginSchema = registerSchema;

export { loginSchema, registerSchema };
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
