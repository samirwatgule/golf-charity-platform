import { Router } from "express";
import { z } from "zod";
import { authJwt } from "../../middleware/authJwt.js";
import { requireRole } from "../../middleware/requireRole.js";
import { requireActiveSubscription } from "../../middleware/requireActiveSubscription.js";
import { db } from "../../config/db.js";

function uniqueRandomNumbers(min: number, max: number, count: number): number[] {
  const set = new Set<number>();
  while (set.size < count) set.add(Math.floor(Math.random() * (max - min + 1)) + min);
  return [...set].sort((a, b) => a - b);
}

function matchedCount(userScores: number[], drawNumbers: number[]) {
  const set = new Set(drawNumbers);
  return userScores.filter((n) => set.has(n)).length;
}

async function generateDrawNumbers(mode: "RANDOM" | "ALGORITHMIC") {
  if (mode === "RANDOM") return uniqueRandomNumbers(1, 45, 5);

  const frequencyRows = await db.query(
    `select score, count(*)::int as cnt
     from scores
     where created_at > now() - interval '6 months'
     group by score
     order by cnt desc, score asc
     limit 20`
  );

  const weightedPool: number[] = [];
  for (const row of frequencyRows.rows as Array<{ score: number; cnt: number }>) {
    const weight = Math.max(1, Math.min(row.cnt, 30));
    for (let i = 0; i < weight; i += 1) weightedPool.push(row.score);
  }

  if (weightedPool.length === 0) return uniqueRandomNumbers(1, 45, 5);

  const picked = new Set<number>();
  while (picked.size < 5 && weightedPool.length > 0) {
    const score = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    picked.add(score);
  }

  while (picked.size < 5) {
    picked.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...picked].sort((a, b) => a - b);
}

const proofSchema = z.object({
  proofUrl: z.string().url()
});

export const drawRouter = Router();

drawRouter.get("/current", authJwt, async (req, res, next) => {
  try {
    const result = await db.query(
      `select id, month_key, mode, draw_numbers, published_at
       from draws
       where status = 'PUBLISHED'
       order by published_at desc
       limit 1`
    );

    const draw = result.rows[0] ?? null;
    if (!draw) return res.json({ draw: null, myMatchedCount: 0 });

    const myScoresResult = await db.query(
      `select score
       from scores
       where user_id = $1
       order by created_at desc
       limit 5`,
      [req.user!.id]
    );

    const myScores = myScoresResult.rows.map((r: { score: number }) => r.score);
    const myMatchedCount = matchedCount(myScores, draw.draw_numbers as number[]);
    return res.json({ draw, myMatchedCount });
  } catch (err) {
    return next(err);
  }
});

drawRouter.get("/history", authJwt, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 10)));
    const offset = (page - 1) * pageSize;

    const result = await db.query(
      `select d.id, d.month_key, d.mode, d.draw_numbers, d.published_at,
              pp.prize_pool_amount, pp.jackpot_rollover_out
       from draws d
       left join prize_pools pp on pp.draw_id = d.id
       where d.status = 'PUBLISHED'
       order by d.published_at desc
       limit $1 offset $2`,
      [pageSize, offset]
    );

    return res.json({ page, pageSize, draws: result.rows });
  } catch (err) {
    return next(err);
  }
});

drawRouter.post("/admin/simulate", authJwt, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const mode = (req.body.mode as "RANDOM" | "ALGORITHMIC") ?? "RANDOM";
    const drawNumbers = await generateDrawNumbers(mode);

    const users = await db.query(`select id from users where role = 'USER' and is_active = true`);
    const preview = [] as Array<{ userId: string; matched: number }>;

    for (const row of users.rows as Array<{ id: string }>) {
      const scoreRows = await db.query(
        `select score from scores where user_id = $1 order by created_at desc limit 5`,
        [row.id]
      );
      const userScores = scoreRows.rows.map((r: { score: number }) => r.score);
      preview.push({ userId: row.id, matched: matchedCount(userScores, drawNumbers) });
    }

    return res.json({ mode, drawNumbers, previewTop10: preview.slice(0, 10) });
  } catch (err) {
    return next(err);
  }
});

drawRouter.post("/admin/publish", authJwt, requireRole("ADMIN"), async (req, res, next) => {
  let client;
  try {
    client = await db.connect();
    const monthKey = req.body.monthKey as string;
    const mode = ((req.body.mode as "RANDOM" | "ALGORITHMIC") ?? "RANDOM");
    const drawNumbers = await generateDrawNumbers(mode);

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({ message: "monthKey must be YYYY-MM" });
    }

    await client.query("begin");

    const drawResult = await client.query(
      `insert into draws (month_key, mode, status, draw_numbers, created_by, published_at)
       values ($1, $2, 'PUBLISHED', $3, $4, now())
       returning id`,
      [monthKey, mode, drawNumbers, req.user!.id]
    );
    const drawId = drawResult.rows[0].id as string;

    const participants = await client.query(
      `select user_id, array_agg(score order by created_at desc) as scores
       from scores
       group by user_id`
    );

    const tier3: string[] = [];
    const tier4: string[] = [];
    const tier5: string[] = [];

    for (const p of participants.rows as Array<{ user_id: string; scores: number[] }>) {
      const matched = matchedCount((p.scores || []).slice(0, 5), drawNumbers);
      if (matched === 5) tier5.push(p.user_id);
      if (matched === 4) tier4.push(p.user_id);
      if (matched === 3) tier3.push(p.user_id);
    }

    const activeUsers = await client.query(
      `select count(*)::int as cnt from subscriptions
       where status in ('ACTIVE','TRIALING') and current_period_end > now()`
    );

    const activeCount = activeUsers.rows[0].cnt as number;
    const gross = activeCount * 100;
    const pool = gross * 0.5;

    const jackpot = pool * 0.4;
    const tier4Total = pool * 0.35;
    const tier3Total = pool * 0.25;

    const tier5Per = tier5.length ? jackpot / tier5.length : 0;
    const tier4Per = tier4.length ? tier4Total / tier4.length : 0;
    const tier3Per = tier3.length ? tier3Total / tier3.length : 0;
    const rolloverOut = tier5.length ? 0 : jackpot;

    await client.query(
      `insert into prize_pools (draw_id, currency, active_subscribers_count, gross_subscription_amount, prize_pool_amount,
        jackpot_rollover_in, jackpot_rollover_out, tier5_amount, tier4_amount, tier3_amount)
       values ($1, 'INR', $2, $3, $4, 0, $5, $6, $7, $8)`,
      [drawId, activeCount, gross, pool, rolloverOut, jackpot, tier4Total, tier3Total]
    );

    for (const userId of tier5) {
      await client.query(
        `insert into winners (draw_id, user_id, matched_count, gross_amount)
         values ($1, $2, 5, $3)`,
        [drawId, userId, tier5Per]
      );
    }
    for (const userId of tier4) {
      await client.query(
        `insert into winners (draw_id, user_id, matched_count, gross_amount)
         values ($1, $2, 4, $3)`,
        [drawId, userId, tier4Per]
      );
    }
    for (const userId of tier3) {
      await client.query(
        `insert into winners (draw_id, user_id, matched_count, gross_amount)
         values ($1, $2, 3, $3)`,
        [drawId, userId, tier3Per]
      );
    }

    await client.query("commit");
    return res.status(201).json({ drawId, drawNumbers, winners: { tier5, tier4, tier3 }, rolloverOut });
  } catch (err) {
    if (client) await client.query("rollback");
    return next(err);
  } finally {
    if (client) client.release();
  }
});

drawRouter.get("/my-winnings", authJwt, requireActiveSubscription, async (req, res, next) => {
  try {
    const result = await db.query(
      `select w.id, w.matched_count, w.gross_amount, w.verification_status, w.payment_status, w.created_at,
              d.month_key
       from winners w
       inner join draws d on d.id = w.draw_id
       where w.user_id = $1
       order by w.created_at desc
       limit 50`,
      [req.user!.id]
    );

    return res.json({ winnings: result.rows });
  } catch (err) {
    return next(err);
  }
});

drawRouter.post("/winners/:id/proof", authJwt, async (req, res, next) => {
  try {
    const input = proofSchema.parse(req.body);
    const result = await db.query(
      `update winners
       set proof_url = $1, verification_status = 'PENDING'
       where id = $2 and user_id = $3
       returning id, proof_url, verification_status`,
      [input.proofUrl, req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Winner record not found" });
    }

    return res.json({ winner: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});
