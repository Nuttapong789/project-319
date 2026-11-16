import type { RequestHandler } from "express";
import { currentToken, currentUser } from "../middleware/auth.js";
import { authService } from "../services/auth.service.js";
import { loginSchema, profileSchema, refreshSchema, registerSchema } from "../validators/auth.validator.js";

export const authController = {
  register: (async (req, res) => {
    res.status(201).json(await authService.register(registerSchema.parse(req.body)));
  }) satisfies RequestHandler,

  login: (async (req, res) => {
    res.json(await authService.login(loginSchema.parse(req.body)));
  }) satisfies RequestHandler,

  refresh: (async (req, res) => {
    res.json(await authService.refresh(refreshSchema.parse(req.body).refreshToken));
  }) satisfies RequestHandler,

  me: ((_req, res) => {
    res.json(currentUser(res));
  }) satisfies RequestHandler,

  // ชื่อใหม่แสดงทันทีในโพสต์และคำขอทั้งหมด (ownerName / userName อ่านจาก profiles ตอน query)
  updateProfile: (async (req, res) => {
    res.json(await authService.updateProfile(currentUser(res), profileSchema.parse(req.body).name));
  }) satisfies RequestHandler,

  logout: (async (_req, res) => {
    await authService.logout(currentToken(res));
    res.status(204).end();
  }) satisfies RequestHandler,
};
