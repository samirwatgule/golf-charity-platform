import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes.js";
import { scoreRouter } from "./modules/scores/score.routes.js";
import { drawRouter } from "./modules/draws/draw.routes.js";
import { charityRouter } from "./modules/charities/charity.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { stripeWebhookHandler } from "./modules/subscriptions/stripe.webhook.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.post("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json());

app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/scores", scoreRouter);
app.use("/api/v1/draws", drawRouter);
app.use("/api/v1/charities", charityRouter);
app.use("/api/v1/admin", adminRouter);

app.use(errorHandler);
