import type { RequestHandler } from "express";
import { currentUser } from "../middleware/auth.js";
import { uploadsService } from "../services/uploads.service.js";

export const uploadsController = {
  create: (async (req, res) => {
    res.status(201).json(await uploadsService.uploadPetImage(currentUser(res).id, req.file));
  }) satisfies RequestHandler,
};
