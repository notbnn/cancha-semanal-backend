import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Protege los endpoints de admin (POST /qr, GET /confirmaciones, PATCH).
// La app manda el token del evento en el header `x-admin-token` — se lo
// guardó en secure storage cuando creó el evento (POST /api/eventos).
// Deja el evento cargado en res.locals.evento para que la ruta no tenga
// que volver a buscarlo en la base.
export async function requireAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const token = req.header("x-admin-token");

  if (!token) {
    return res.status(401).json({ error: "Falta el header x-admin-token" });
  }

  const evento = await prisma.evento.findUnique({ where: { id } });

  if (!evento) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }

  if (evento.adminToken !== token) {
    return res.status(403).json({ error: "Token de administración inválido" });
  }

  res.locals.evento = evento;
  next();
}
