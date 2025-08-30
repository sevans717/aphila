import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { createUser, findUserByEmail } from "../services/user.service";
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from "../utils/password";
import { logFailedLogin, logSuccessfulLogin } from "../utils/security-audit";

async function registerHandler(req: any, res: any) {
  const { email, password } = req.body as { email: string; password: string };

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: "PasswordTooWeak",
      message: "Password does not meet security requirements",
      details: passwordValidation.errors,
    });
  }

  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ error: "EmailInUse" });

  const hashedPassword = await hashPassword(password);
  const user = await createUser(email, hashedPassword);

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn || "15m",
    }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtRefreshSecret || env.jwtSecret,
    { expiresIn: env.jwtRefreshExpiresIn || "30d" }
  );

  // Log successful registration
  logSuccessfulLogin(user.id, user.email, req.ip, res.locals.requestId);

  return res.status(201).json({
    token,
    refreshToken,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  });
}

async function loginHandler(req: any, res: any) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await findUserByEmail(email);

  if (!user) {
    logFailedLogin(email, req.ip, "User not found", res.locals.requestId);
    return res.status(401).json({ error: "InvalidCredentials" });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    logFailedLogin(email, req.ip, "Invalid password", res.locals.requestId);
    return res.status(401).json({ error: "InvalidCredentials" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn || "15m",
    }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtRefreshSecret || env.jwtSecret,
    { expiresIn: env.jwtRefreshExpiresIn || "30d" }
  );

  // Log successful login
  logSuccessfulLogin(user.id, user.email, req.ip, res.locals.requestId);

  return res.json({
    token,
    refreshToken,
    user: { id: user.id, email: user.email },
  });
}

export { loginHandler, registerHandler };

async function refreshHandler(req: any, res: any) {
  // Accept either a refresh token in the body or a bearer token for compatibility
  const providedRefresh = req.body?.refreshToken;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : undefined;

  const tokenToVerify = providedRefresh || bearerToken;
  if (!tokenToVerify) return res.status(401).json({ error: "Unauthorized" });

  // Verify against refresh secret if provided, otherwise try access secret for compatibility
  const secrets = [env.jwtRefreshSecret, env.jwtSecret].filter(
    Boolean
  ) as string[];
  let payload: any = null;
  for (const secret of secrets) {
    try {
      payload = jwt.verify(tokenToVerify, secret) as any;
      break;
    } catch {
      // try next
    }
  }

  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  // Issue new access token (and rotate refresh token)
  const newAccessToken = jwt.sign(
    { userId: payload.userId, email: payload.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn || "15m" }
  );
  const newRefreshToken = jwt.sign(
    { userId: payload.userId, email: payload.email },
    env.jwtRefreshSecret || env.jwtSecret,
    { expiresIn: env.jwtRefreshExpiresIn || "30d" }
  );

  return res.json({ token: newAccessToken, refreshToken: newRefreshToken });
}

export { refreshHandler };

async function meHandler(req: any, res: any) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user: { id: user.userId, email: user.email } });
}

export { meHandler };
