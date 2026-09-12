import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generarAdminToken, generarSlug } from "../lib/tokens";
import { requireAdminToken } from "../middleware/requireAdminToken";

export const eventosRouter = Router();

// POST /api/eventos — crear evento (§04). Sin auth: cualquiera con la app
// puede crear un evento; lo que protege el evento después es el
// adminToken que se devuelve acá UNA sola vez.
eventosRouter.post("/", async (req, res) => {
    const { fecha, nombreCancha, horaFin } = req.body ?? {};

  if (!fecha || Number.isNaN(new Date(fecha).getTime())) {
    return res
      .status(400)
      .json({ error: "fecha es obligatoria y tiene que ser una fecha válida (ISO 8601)" });
  }
  if (nombreCancha !== undefined && typeof nombreCancha !== "string") {
    return res.status(400).json({ error: "nombreCancha tiene que ser texto" });
  }
    // "HH:mm" simple, ej. "22:00" — no validamos que sea posterior a la hora
  // de inicio, es solo un dato informativo para la página pública.
  if (horaFin !== undefined && !/^\d{2}:\d{2}$/.test(horaFin)) {
    return res.status(400).json({ error: 'horaFin tiene que tener formato "HH:mm"' });
  }

  const adminToken = generarAdminToken();

  // El slug es aleatorio pero podría chocar (poco probable con 8 hex,
  // pero el índice único de la base lo va a rechazar si pasa) — 5
  // reintentos alcanzan de sobra para un MVP.
  for (let intento = 0; intento < 5; intento++) {
    const slug = generarSlug();
    try {
      const evento = await prisma.evento.create({
        data: {
          slug,
          fecha: new Date(fecha),
          nombreCancha,
          adminToken,
        },
      });
      // Única vez que el adminToken viaja en una respuesta — la app lo
      // tiene que guardar ahora (secure storage) o se pierde el acceso
      // de administración a este evento.
      return res.status(201).json(evento);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue; // slug repetido, probamos con otro
      }
      throw err;
    }
  }
  return res.status(500).json({ error: "No se pudo generar un slug único, reintentá" });
});

// POST /api/eventos/:id/qr — subir QR (§04). El backend no maneja el
// upload del archivo en sí (no hay storage configurado en este MVP): la
// app sube la imagen a donde sea (por ahora, un link público cualquiera)
// y acá solo se guarda esa URL.
eventosRouter.post("/:id/qr", requireAdminToken, async (req, res) => {
  const { qrUrl } = req.body ?? {};

  if (!qrUrl || typeof qrUrl !== "string") {
    return res.status(400).json({ error: "qrUrl es obligatorio y tiene que ser texto" });
  }

  const evento = await prisma.evento.update({
    where: { id: res.locals.evento.id },
    data: { qrUrl },
  });

  return res.json(evento);
});

// GET /api/eventos/:id/confirmaciones — listar confirmaciones para que la
// app las sincronice (UPSERT local por uuid, ver README del repo).
eventosRouter.get("/:id/confirmaciones", requireAdminToken, async (_req, res) => {
  const confirmaciones = await prisma.confirmacion.findMany({
    where: { eventoId: res.locals.evento.id },
    orderBy: { creadoEn: "asc" },
  });

  return res.json(confirmaciones);
});

// PATCH /api/eventos/:id — actualizar evento. Uso principal: cerrar el
// partido (estado: "cerrado"), pero también deja corregir fecha/cancha.
eventosRouter.patch("/:id", requireAdminToken, async (req, res) => {
  const { estado, nombreCancha, fecha } = req.body ?? {};
  const data: Prisma.EventoUpdateInput = {};

  if (estado !== undefined) {
    if (estado !== "abierto" && estado !== "cerrado") {
      return res.status(400).json({ error: 'estado tiene que ser "abierto" o "cerrado"' });
    }
    data.estado = estado;
  }
  if (nombreCancha !== undefined) {
    if (typeof nombreCancha !== "string") {
      return res.status(400).json({ error: "nombreCancha tiene que ser texto" });
    }
    data.nombreCancha = nombreCancha;
  }
  if (fecha !== undefined) {
    if (Number.isNaN(new Date(fecha).getTime())) {
      return res.status(400).json({ error: "fecha tiene que ser una fecha válida (ISO 8601)" });
    }
    data.fecha = new Date(fecha);
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Mandá al menos un campo para actualizar" });
  }

  const evento = await prisma.evento.update({
    where: { id: res.locals.evento.id },
    data,
  });

  return res.json(evento);
});
