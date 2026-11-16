import type { RequestHandler } from "express";
import { currentUser } from "../middleware/auth.js";
import { petsService } from "../services/pets.service.js";
import { parseId } from "../validators/common.validator.js";
import { petFiltersSchema, petInputSchema } from "../validators/pets.validator.js";

const petId = (value: unknown) => parseId(value, "ไม่พบน้องที่ต้องการ");

export const petsController = {
  list: (async (req, res) => {
    res.json(await petsService.list(petFiltersSchema.parse(req.query)));
  }) satisfies RequestHandler,

  get: (async (req, res) => {
    res.json(await petsService.get(petId(req.params.id)));
  }) satisfies RequestHandler,

  listMine: (async (_req, res) => {
    res.json(await petsService.listMine(currentUser(res).id));
  }) satisfies RequestHandler,

  create: (async (req, res) => {
    res.status(201).json(await petsService.create(currentUser(res).id, petInputSchema.parse(req.body)));
  }) satisfies RequestHandler,

  update: (async (req, res) => {
    const id = petId(req.params.id);
    res.json(await petsService.update(currentUser(res).id, id, petInputSchema.parse(req.body)));
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    await petsService.remove(currentUser(res).id, petId(req.params.id));
    res.status(204).end();
  }) satisfies RequestHandler,
};
