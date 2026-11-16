import type { RequestHandler } from "express";
import { currentUser } from "../middleware/auth.js";
import { favoritesService } from "../services/favorites.service.js";
import { parseId } from "../validators/common.validator.js";
import { favoriteInputSchema } from "../validators/favorites.validator.js";

export const favoritesController = {
  list: (async (_req, res) => {
    res.json(await favoritesService.list(currentUser(res).id));
  }) satisfies RequestHandler,

  add: (async (req, res) => {
    const { petId } = favoriteInputSchema.parse(req.body);
    await favoritesService.add(currentUser(res).id, petId);
    res.status(201).end();
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    await favoritesService.remove(currentUser(res).id, parseId(req.params.petId, "ไม่พบน้องที่ต้องการ"));
    res.status(204).end();
  }) satisfies RequestHandler,
};
