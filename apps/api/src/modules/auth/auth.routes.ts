import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";
import { authJwt } from "../../middleware/authJwt.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  defaultCharityId: z.string().uuid(),
  donationPercent: z.number().min(10).max(100).default(10)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(16)
});

const logoutSchema = z.object({
  refreshToken: z.string().min(16).optional()
});

function tokenHash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseJwtExpiryToDate(token: string) {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  return new Date(decoded.exp * 1000);
}

function signTokens(user: { id: string; email: string; role: "USER" | "ADMIN" }) {
  const refreshJti = crypto.randomUUID();
  const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m"
  });
  const refreshToken = jwt.sign({ sub: user.id, jti: refreshJti }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
  return { accessToken, refreshToken, refreshJti };
}

async function persistRefreshToken(userId: string, refreshToken: string) {
  await db.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, tokenHash(refreshToken), parseJwtExpiryToDate(refreshToken)]
  );
}

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const inserted = await db.query(
      `insert into users (email, password_hash, full_name, role, default_charity_id, donation_percent)
       values ($1, $2, $3, 'USER', $4, $5)
       returning id, email, role`,
      [input.email, passwordHash, input.fullName, input.defaultCharityId, input.donationPercent]
    );

    const user = inserted.rows[0] as { id: string; email: string; role: "USER" | "ADMIN" };
    const tokens = signTokens(user);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return res.status(201).json({ user, tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await db.query(
      `select id, email, role, password_hash from users where email = $1 and is_active = true limit 1`,
      [input.email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0] as {
      id: string;
      email: string;
      role: "USER" | "ADMIN";
      password_hash: string;
    };

    const ok = await bcrypt.compare(input.password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = signTokens({ id: user.id, email: user.email, role: user.role });
    await persistRefreshToken(user.id, tokens.refreshToken);
    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    let payload: { sub: string; jti?: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; jti?: string };
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const existingToken = await db.query(
      `select id, user_id
       from refresh_tokens
       where token_hash = $1 and revoked_at is null and expires_at > now()
       limit 1`,
      [tokenHash(refreshToken)]
    );

    if (existingToken.rowCount === 0) {
      return res.status(401).json({ message: "Refresh token is revoked or expired" });
    }

    const tokenUserId = existingToken.rows[0].user_id as string;
    if (tokenUserId !== payload.sub) {
      return res.status(401).json({ message: "Refresh token subject mismatch" });
    }

    const userResult = await db.query(
      `select id, email, role
       from users
       where id = $1 and is_active = true
       limit 1`,
      [payload.sub]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userResult.rows[0] as { id: string; email: string; role: "USER" | "ADMIN" };
    const tokens = signTokens(user);

    await db.query(
      `update refresh_tokens
       set revoked_at = now()
       where token_hash = $1`,
      [tokenHash(refreshToken)]
    );

    await persistRefreshToken(user.id, tokens.refreshToken);

    return res.json({
      user,
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/logout", authJwt, async (req, res, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body ?? {});
    if (refreshToken) {
      await db.query(
        `update refresh_tokens
         set revoked_at = now()
         where user_id = $1 and token_hash = $2 and revoked_at is null`,
        [req.user!.id, tokenHash(refreshToken)]
      );
    } else {
      await db.query(
        `update refresh_tokens
         set revoked_at = now()
         where user_id = $1 and revoked_at is null`,
        [req.user!.id]
      );
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});
