import { Router } from "express";
import { z } from "zod";
import { db } from "../../config/db.js";
import { authJwt } from "../../middleware/authJwt.js";

export const charityRouter = Router();

const updatePreferenceSchema = z.object({
  defaultCharityId: z.string().uuid(),
  donationPercent: z.number().min(10).max(100)
});

charityRouter.get("/", async (req, res, next) => {
  try {
    const search = ((req.query.search as string) ?? "").trim().toLowerCase();
    const category = ((req.query.category as string) ?? "").trim().toLowerCase();
    const country = ((req.query.country as string) ?? "").trim().toUpperCase();
    const result = await db.query(
      `select id, name, slug, category, country_code, mission, hero_image_url, verified
       from charities
       where active = true
         and ($1 = '' or lower(name) like '%' || $1 || '%')
         and ($2 = '' or lower(category) = $2)
         and ($3 = '' or country_code = $3)
       order by verified desc, name asc
       limit 50`,
      [search, category, country]
    );

    return res.json({ charities: result.rows });
  } catch (err) {
    return next(err);
  }
});

charityRouter.patch("/preference", authJwt, async (req, res, next) => {
  try {
    const input = updatePreferenceSchema.parse(req.body);
    const result = await db.query(
      `update users
       set default_charity_id = $1,
           donation_percent = $2,
           updated_at = now()
       where id = $3
       returning id, default_charity_id, donation_percent`,
      [input.defaultCharityId, input.donationPercent, req.user!.id]
    );

    return res.json({ preference: result.rows[0] ?? null });
  } catch (err) {
    return next(err);
  }
});

charityRouter.get("/:slug", async (req, res, next) => {
  try {
    const result = await db.query(
      `select id, name, slug, category, country_code, mission, hero_image_url, website_url, verified
       from charities
       where slug = $1 and active = true
       limit 1`,
      [req.params.slug]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Charity not found" });
    return res.json({ charity: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});
