import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireRecoverySecret } from "../middleware/requireRecoverySecret";

export const recuperarRouter = Router();

// GET /api/recuperar/:slug — devuelve el evento completo (incluido el
// adminToken) a partir de su slug. Uso de emergencia: cuando la app
// pierde su base local (ej. una reinstalación) y hay que reconectarla
// a mano a un evento que ya existía en el backend.
recuperarRouter.get("/:slug", requireRecoverySecret, async (req, res) => {
  const evento = await prisma.evento.findUnique({
    where: { slug: req.params.slug },
  });

  if (!evento) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }

  return res.json(evento);
});