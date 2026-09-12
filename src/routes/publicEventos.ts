import { Router } from "express";
import { prisma } from "../lib/prisma";

export const publicEventosRouter = Router();

// Lo que ve el invitado nunca incluye adminToken — esa es la frontera de
// seguridad de todo este backend (ver comentario en schema.prisma).
function aVistaPublica(evento: {
  id: string;
  slug: string;
  fecha: Date;
  nombreCancha: string | null;
  qrUrl: string | null;
  horaFin: string | null;
  estado: string;
  creadoEn: Date;
}) {
  const { id, slug, fecha, nombreCancha, qrUrl, horaFin, estado, creadoEn } = evento;
  return { id, slug, fecha, nombreCancha, qrUrl, horaFin, estado, creadoEn };
}

// GET /api/public/eventos/:slug — lo que abre el invitado desde el link
// de WhatsApp: fecha, cancha, QR y si todavía se puede confirmar.
publicEventosRouter.get("/:slug", async (req, res) => {
  const evento = await prisma.evento.findUnique({
    where: { slug: req.params.slug },
  });

  if (!evento) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }

  return res.json(aVistaPublica(evento));
});

// POST /api/public/eventos/:slug/confirmar — el invitado confirma que va.
// Sin auth (es público), pero valida que el evento siga abierto.
publicEventosRouter.post("/:slug/confirmar", async (req, res) => {
  const { nombreInvitado, telefono } = req.body ?? {};

  if (!nombreInvitado || typeof nombreInvitado !== "string" || !nombreInvitado.trim()) {
    return res.status(400).json({ error: "nombreInvitado es obligatorio" });
  }
  if (telefono !== undefined && typeof telefono !== "string") {
    return res.status(400).json({ error: "telefono tiene que ser texto" });
  }

  const evento = await prisma.evento.findUnique({
    where: { slug: req.params.slug },
  });

  if (!evento) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }
  if (evento.estado !== "abierto") {
    return res.status(409).json({ error: "Este evento ya no acepta confirmaciones" });
  }

  const confirmacion = await prisma.confirmacion.create({
    data: {
      eventoId: evento.id,
      nombreInvitado: nombreInvitado.trim(),
      telefono,
      ipOrigen: req.ip,
    },
  });

  return res.status(201).json(confirmacion);
});
