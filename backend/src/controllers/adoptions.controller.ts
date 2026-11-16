import type { RequestHandler } from "express";
import { currentUser } from "../middleware/auth.js";
import { adoptionsService } from "../services/adoptions.service.js";
import { adoptionInputSchema, reviewSchema } from "../validators/adoptions.validator.js";
import { parseId } from "../validators/common.validator.js";

const petId = (value: unknown) => parseId(value, "ไม่พบน้องที่ต้องการ");
const requestId = (value: unknown) => parseId(value, "ไม่พบคำขอ");

export const adoptionsController = {
  listMine: (async (_req, res) => {
    res.json(await adoptionsService.listMine(currentUser(res).id));
  }) satisfies RequestHandler,

  listForPet: (async (req, res) => {
    res.json(await adoptionsService.listForPet(currentUser(res).id, petId(req.params.id)));
  }) satisfies RequestHandler,

  create: (async (req, res) => {
    const id = petId(req.params.id);
    res.status(201).json(await adoptionsService.create(currentUser(res).id, id, adoptionInputSchema.parse(req.body)));
  }) satisfies RequestHandler,

  cancel: (async (req, res) => {
    await adoptionsService.cancel(currentUser(res).id, requestId(req.params.id));
    res.status(204).end();
  }) satisfies RequestHandler,

  review: (async (req, res) => {
    const id = requestId(req.params.id);
    const { status } = reviewSchema.parse(req.body);
    res.json(await adoptionsService.review(currentUser(res).id, id, status));
  }) satisfies RequestHandler,
};
