import { Router } from "express";
import { Prisma } from "@prisma/client";
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
  ubicacionUrl: string | null;
  estado: string;
  creadoEn: Date;
  titulo: string | null;
}) {
  const { id, slug, fecha, nombreCancha, qrUrl, horaFin, ubicacionUrl, estado, creadoEn, titulo } = evento;
  return { id, slug, fecha, nombreCancha, qrUrl, horaFin, ubicacionUrl, estado, creadoEn, titulo };
}

// Teléfono boliviano: empieza con 6 o 7 (celulares), 8 dígitos en total.
const TELEFONO_BOLIVIA = /^[67]\d{7}$/;
const METODOS_PAGO_VALIDOS = ["qr", "efectivo"];

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

// GET /api/public/eventos/:slug/confirmaciones — lista pública de quién ya
// confirmó. Solo nombres (sin teléfono ni IP): eso es privado, solo lo ve
// el organizador desde la app vía el endpoint de admin en eventos.ts.
publicEventosRouter.get("/:slug/confirmaciones", async (req, res) => {
  const evento = await prisma.evento.findUnique({
    where: { slug: req.params.slug },
  });

  if (!evento) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }

  const confirmaciones = await prisma.confirmacion.findMany({
    where: { eventoId: evento.id },
    orderBy: { creadoEn: "asc" },
    select: { nombreInvitado: true, creadoEn: true },
  });

  return res.json(confirmaciones);
});

// POST /api/public/eventos/:slug/confirmar — el invitado confirma que va.
// Sin auth (es público), pero valida que el evento siga abierto.
publicEventosRouter.post("/:slug/confirmar", async (req, res) => {
  const { nombreInvitado, telefono, metodoPago } = req.body ?? {};

  if (!nombreInvitado || typeof nombreInvitado !== "string" || !nombreInvitado.trim()) {
    return res.status(400).json({ error: "nombreInvitado es obligatorio" });
  }
  if (typeof telefono !== "string" || !TELEFONO_BOLIVIA.test(telefono.trim())) {
    return res.status(400).json({
      error: "telefono es obligatorio: tiene que empezar con 6 o 7 y tener 8 dígitos",
    });
  }
  if (typeof metodoPago !== "string" || !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    return res.status(400).json({
      error: 'metodoPago es obligatorio: tiene que ser "qr" o "efectivo"',
    });
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

  const telefonoLimpio = telefono.trim();

  // Chequeo explicito ademas del constraint de la base: da un mensaje
  // mas claro que dejar que reviente el P2002 en el caso normal (sin
  // condicion de carrera).
  const yaConfirmo = await prisma.confirmacion.findFirst({
    where: { eventoId: evento.id, telefono: telefonoLimpio },
  });
  if (yaConfirmo) {
    return res.status(409).json({
      error: "Ya confirmaste con este número para este partido",
    });
  }

  try {
    const confirmacion = await prisma.confirmacion.create({
      data: {
        eventoId: evento.id,
        nombreInvitado: nombreInvitado.trim(),
        telefono: telefonoLimpio,
        metodoPago,
        ipOrigen: req.ip,
      },
    });

    return res.status(201).json(confirmacion);
  } catch (err) {
    // Red de seguridad por si dos confirmaciones con el mismo telefono
    // llegan casi al mismo tiempo (condicion de carrera) — el constraint
    // @@unique de la base las frena aunque el chequeo de arriba no llegue.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(409).json({
        error: "Ya confirmaste con este número para este partido",
      });
    }
    throw err;
  }
});