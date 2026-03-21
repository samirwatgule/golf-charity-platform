import { Router } from "express";
import Stripe from "stripe";
import { env } from "../../config/env.js";
import { authJwt } from "../../middleware/authJwt.js";
import { db } from "../../config/db.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const subscriptionRouter = Router();

subscriptionRouter.get("/me", authJwt, async (req, res, next) => {
  try {
    const result = await db.query(
      `select plan_interval, status, current_period_start, current_period_end
       from subscriptions
       where user_id = $1
       order by current_period_end desc
       limit 1`,
      [req.user!.id]
    );

    return res.json({ subscription: result.rows[0] ?? null });
  } catch (err) {
    return next(err);
  }
});

subscriptionRouter.post("/checkout-session", authJwt, async (req, res, next) => {
  try {
    const { priceId } = req.body as { priceId: string };
    const userResult = await db.query(
      `select email from users where id = $1 limit 1`,
      [req.user!.id]
    );
    const userEmail = userResult.rows[0]?.email as string | undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${env.FRONTEND_URL}/dashboard?checkout=cancelled`,
      customer_email: userEmail,
      metadata: { userId: req.user!.id },
      subscription_data: {
        metadata: { userId: req.user!.id }
      }
    });

    return res.json({ url: session.url });
  } catch (err) {
    return next(err);
  }
});

subscriptionRouter.post("/cancel", authJwt, async (req, res, next) => {
  try {
    const latest = await db.query(
      `select stripe_subscription_id
       from subscriptions
       where user_id = $1 and stripe_subscription_id is not null
       order by current_period_end desc
       limit 1`,
      [req.user!.id]
    );

    if (latest.rowCount === 0) {
      return res.status(404).json({ message: "No active stripe subscription found" });
    }

    const stripeSubscriptionId = latest.rows[0].stripe_subscription_id as string;
    await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });

    await db.query(
      `update subscriptions
       set cancel_at_period_end = true, cancelled_at = now(), status = 'CANCELLED', updated_at = now()
       where stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});
