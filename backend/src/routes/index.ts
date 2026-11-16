// รายชื่อ route ทั้งหมด (อยู่ใต้ /api) — ตรงกับ frontend/src/api/*.ts และ docs/backend-api.md
import { Router } from "express";
import { adoptionsController } from "../controllers/adoptions.controller.js";
import { authController } from "../controllers/auth.controller.js";
import { favoritesController } from "../controllers/favorites.controller.js";
import { petsController } from "../controllers/pets.controller.js";
import { uploadsController } from "../controllers/uploads.controller.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { uploadImage } from "../middleware/upload.js";

export const routes = Router();

// ---- Auth ----
routes.post("/auth/register", rateLimit("สมัครสมาชิก", env.RATE_LIMIT_REGISTER_PER_MINUTE), authController.register);
routes.post("/auth/login", rateLimit("เข้าสู่ระบบ", env.RATE_LIMIT_LOGIN_PER_MINUTE), authController.login);
// ไม่ต้องมี access token (อาจหมดอายุไปแล้ว) ใช้ refresh token แทน
routes.post("/auth/refresh", rateLimit("ต่ออายุการเข้าสู่ระบบ", env.RATE_LIMIT_REFRESH_PER_MINUTE), authController.refresh);
routes.get("/auth/me", requireAuth, authController.me);
routes.post("/auth/logout", requireAuth, authController.logout);

// ---- Pets ----
routes.get("/pets", petsController.list);
routes.get("/pets/:id", petsController.get);
routes.post("/pets", requireAuth, petsController.create);
routes.put("/pets/:id", requireAuth, petsController.update);
routes.delete("/pets/:id", requireAuth, petsController.remove);

// ---- ของฉัน ----
routes.get("/me/pets", requireAuth, petsController.listMine);
routes.get("/me/favorites", requireAuth, favoritesController.list);
routes.post("/me/favorites", requireAuth, favoritesController.add);
routes.delete("/me/favorites/:petId", requireAuth, favoritesController.remove);
routes.get("/me/adoptions", requireAuth, adoptionsController.listMine);
routes.patch("/me/profile", requireAuth, authController.updateProfile);

// ---- คำขอรับเลี้ยง ----
routes.post("/pets/:id/adoptions", requireAuth, adoptionsController.create);
routes.get("/pets/:id/adoptions", requireAuth, adoptionsController.listForPet);
routes.delete("/adoptions/:id", requireAuth, adoptionsController.cancel);
routes.patch("/adoptions/:id", requireAuth, adoptionsController.review);

// ---- อัปโหลดรูป ----
routes.post("/uploads", requireAuth, uploadImage, uploadsController.create);
