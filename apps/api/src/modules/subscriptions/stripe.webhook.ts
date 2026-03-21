import type { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING" {
  if (status === "active") return "ACTIVE";
  if (status === "trialing") return "TRIALING";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "PAST_DUE";
  if (status === "canceled" || status === "incomplete_expired") return "CANCELLED";
  return "EXPIRED";
}

function mapPlanInterval(interval?: Stripe.Price.Recurring.Interval): "MONTHLY" | "YEARLY" {
  return interval === "year" ? "YEARLY" : "MONTHLY";
}

async function findUserIdForSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const metadataUserId = sub.metadata?.userId;
  if (metadataUserId) return metadataUserId;

  const lookup = await db.query(
    `select user_id
     from subscriptions
     where stripe_subscription_id = $1
     limit 1`,
    [sub.id]
  );

  if (lookup.rowCount === 0) return null;
  return lookup.rows[0].user_id as string;
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription) {
  const recurring = sub.items.data[0]?.price?.recurring;

  await db.query(
    `insert into subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan_interval,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      cancelled_at,
      ended_at,
      updated_at
    ) values (
      $1, $2, $3, $4, $5,
      to_timestamp($6),
      to_timestamp($7),
      $8,
      case when $9 then now() else null end,
      case when $10 then now() else null end,
      now()
    )
    on conflict (stripe_subscription_id)
    do update set
      user_id = excluded.user_id,
      stripe_customer_id = excluded.stripe_customer_id,
      plan_interval = excluded.plan_interval,
      status = excluded.status,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      cancelled_at = excluded.cancelled_at,
      ended_at = excluded.ended_at,
      updated_at = now()`,
    [
      userId,
      String(sub.customer),
      sub.id,
      mapPlanInterval(recurring?.interval),
      mapStripeStatus(sub.status),
      sub.current_period_start,
      sub.current_period_end,
      sub.cancel_at_period_end,
      sub.cancel_at_period_end,
      sub.status === "canceled"
    ]
  );
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ message: "Missing stripe signature" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    const dedupe = await db.query(
      `insert into stripe_webhook_events (event_id, event_type)
       values ($1, $2)
       on conflict (event_id) do nothing
       returning id`,
      [event.id, event.type]
    );

    if (dedupe.rowCount === 0) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await findUserIdForSubscription(sub);
      if (userId) {
        await upsertSubscription(userId, sub);
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        const userId = session.metadata?.userId ?? (await findUserIdForSubscription(sub));
        if (userId) {
          await upsertSubscription(userId, sub);
        }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (stripeSubscriptionId) {
        await db.query(
          `update subscriptions
           set status = 'PAST_DUE', updated_at = now()
           where stripe_subscription_id = $1`,
          [stripeSubscriptionId]
        );
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (stripeSubscriptionId) {
        await db.query(
          `update subscriptions
           set status = 'ACTIVE', updated_at = now()
           where stripe_subscription_id = $1`,
          [stripeSubscriptionId]
        );
      }
    }

    await db.query(
      `update stripe_webhook_events
       set processed_at = now()
       where event_id = $1`,
      [event.id]
    );

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
}
