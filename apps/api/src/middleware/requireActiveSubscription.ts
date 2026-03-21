import type { NextFunction, Request, Response } from "express";
import { db } from "../config/db.js";

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await db.query(
    `select status, current_period_end
     from subscriptions
     where user_id = $1
     order by current_period_end desc
     limit 1`,
    [req.user.id]
  );

  if (result.rowCount === 0) {
    return res.status(403).json({ code: "SUBSCRIPTION_INACTIVE", message: "No subscription found" });
  }

  const sub = result.rows[0] as { status: string; current_period_end: string };
  const active = ["ACTIVE", "TRIALING"].includes(sub.status);
  const notExpired = new Date(sub.current_period_end) > new Date();

  if (!active || !notExpired) {
    return res.status(403).json({ code: "SUBSCRIPTION_INACTIVE", message: "Subscription is not active" });
  }

  return next();
}
