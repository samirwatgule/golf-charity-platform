import { Router } from "express";
import { z } from "zod";
import { authJwt } from "../../middleware/authJwt.js";
import { requireRole } from "../../middleware/requireRole.js";
import { db } from "../../config/db.js";

export const adminRouter = Router();

const charitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().min(2),
  countryCode: z.string().min(2).max(3),
  mission: z.string().min(10),
  heroImageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  verified: z.boolean().default(false),
  active: z.boolean().default(true)
});

const updateUserSchema = z.object({
  isActive: z.boolean()
});

adminRouter.use(authJwt, requireRole("ADMIN"));

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const result = await db.query(
      `select id, email, full_name, role, is_active, created_at
       from users
       order by created_at desc
       limit 100`
    );
    return res.json({ users: result.rows });
  } catch (err) {
    return next(err);
  }
});

adminRouter.patch("/winners/:id/verify", async (req, res, next) => {
  try {
    const verifyStatus = req.body?.status === "REJECTED" ? "REJECTED" : "VERIFIED";
    const result = await db.query(
      `update winners
       set verification_status = $1, verified_by = $2, verified_at = now()
       where id = $3
       returning id, verification_status`,
      [verifyStatus, req.user!.id, req.params.id]
    );
    return res.json({ winner: result.rows[0] ?? null });
  } catch (err) {
    return next(err);
  }
});

adminRouter.patch("/winners/:id/pay", async (req, res, next) => {
  try {
    const status = req.body?.status === "FAILED" ? "FAILED" : "PAID";
    const result = await db.query(
      `update winners
       set payment_status = $1,
           paid_at = case when $1 = 'PAID' then now() else paid_at end
       where id = $2
       returning id, payment_status, paid_at`,
      [status, req.params.id]
    );
    return res.json({ winner: result.rows[0] ?? null });
  } catch (err) {
    return next(err);
  }
});

adminRouter.patch("/users/:id/status", async (req, res, next) => {
  try {
    const input = updateUserSchema.parse(req.body);
    const result = await db.query(
      `update users
       set is_active = $1, updated_at = now()
       where id = $2
       returning id, email, is_active`,
      [input.isActive, req.params.id]
    );
    return res.json({ user: result.rows[0] ?? null });
  } catch (err) {
    return next(err);
  }
});

adminRouter.post("/charities", async (req, res, next) => {
  try {
    const input = charitySchema.parse(req.body);
    const result = await db.query(
      `insert into charities (name, slug, category, country_code, mission, hero_image_url, website_url, verified, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id, name, slug, verified, active`,
      [
        input.name,
        input.slug,
        input.category,
        input.countryCode.toUpperCase(),
        input.mission,
        input.heroImageUrl ?? null,
        input.websiteUrl ?? null,
        input.verified,
        input.active
      ]
    );
    return res.status(201).json({ charity: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

adminRouter.patch("/charities/:id", async (req, res, next) => {
  try {
    const input = charitySchema.partial().parse(req.body);
    const result = await db.query(
      `update charities
       set name = coalesce($1, name),
           slug = coalesce($2, slug),
           category = coalesce($3, category),
           country_code = coalesce($4, country_code),
           mission = coalesce($5, mission),
           hero_image_url = coalesce($6, hero_image_url),
           website_url = coalesce($7, website_url),
           verified = coalesce($8, verified),
           active = coalesce($9, active),
           updated_at = now()
       where id = $10
       returning id, name, slug, verified, active`,
      [
        input.name ?? null,
        input.slug ?? null,
        input.category ?? null,
        input.countryCode?.toUpperCase() ?? null,
        input.mission ?? null,
        input.heroImageUrl ?? null,
        input.websiteUrl ?? null,
        input.verified ?? null,
        input.active ?? null,
        req.params.id
      ]
    );
    return res.json({ charity: result.rows[0] ?? null });
  } catch (err) {
    return next(err);
  }
});

adminRouter.delete("/charities/:id", async (req, res, next) => {
  try {
    await db.query(
      `update charities
       set active = false, updated_at = now()
       where id = $1`,
      [req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

adminRouter.get("/analytics/overview", async (_req, res, next) => {
  try {
    const [users, activeSubs, payoutPending, charities, donations] = await Promise.all([
      db.query(`select count(*)::int as cnt from users where role = 'USER'`),
      db.query(`select count(*)::int as cnt from subscriptions where status in ('ACTIVE','TRIALING') and current_period_end > now()`),
      db.query(`select coalesce(sum(gross_amount), 0)::numeric(14,2) as amount from winners where payment_status = 'PENDING' and verification_status = 'VERIFIED'`),
      db.query(`select count(*)::int as cnt from charities where active = true`),
      db.query(`select coalesce(sum(amount), 0)::numeric(14,2) as amount from donations`)
    ]);

    return res.json({
      users: users.rows[0].cnt,
      activeSubscriptions: activeSubs.rows[0].cnt,
      payoutPendingAmount: payoutPending.rows[0].amount,
      activeCharities: charities.rows[0].cnt,
      totalDonations: donations.rows[0].amount
    });
  } catch (err) {
    return next(err);
  }
});
