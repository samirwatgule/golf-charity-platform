import { Router } from "express";
import { z } from "zod";
import { db } from "../../config/db.js";
import { authJwt } from "../../middleware/authJwt.js";
import { requireActiveSubscription } from "../../middleware/requireActiveSubscription.js";

const createScoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  date: z.string().date()
});

export const scoreRouter = Router();

scoreRouter.get("/me", authJwt, requireActiveSubscription, async (req, res, next) => {
  try {
    const result = await db.query(
      `select id, score, played_at
       from scores
       where user_id = $1
       order by created_at desc
       limit 5`,
      [req.user!.id]
    );

    return res.json({ scores: result.rows });
  } catch (err) {
    return next(err);
  }
});

scoreRouter.post("/", authJwt, requireActiveSubscription, async (req, res, next) => {
  let client;
  try {
    client = await db.connect();
    const input = createScoreSchema.parse(req.body);

    await client.query("begin");
    await client.query(
      `insert into scores (user_id, score, played_at)
       values ($1, $2, $3)`,
      [req.user!.id, input.score, input.date]
    );

    await client.query(
      `delete from scores
       where id in (
         select id
         from scores
         where user_id = $1
         order by created_at desc
         offset 5
       )`,
      [req.user!.id]
    );

    const latest = await client.query(
      `select score, played_at
       from scores
       where user_id = $1
       order by created_at desc
       limit 5`,
      [req.user!.id]
    );

    await client.query("commit");
    return res.status(201).json({ scores: latest.rows });
  } catch (err) {
    await client.query("rollback");
    return next(err);
  } finally {
    if (client) client.release();
  }
});
