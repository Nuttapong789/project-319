import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { routes } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
// อยู่หลัง reverse proxy (Render/Railway/Nginx) ให้ตั้ง TRUST_PROXY=1 ไม่งั้นทุกคนได้ IP ของ proxy และโดน rate limit รวมกัน
app.set("trust proxy", env.TRUST_PROXY);
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
app.use(express.json({ limit: "100kb" }));

// ตรวจว่า server ทำงานและต่อฐานข้อมูลได้
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`select 1`;
    res.json({ status: "ok", database: "ok" });
  } catch {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
