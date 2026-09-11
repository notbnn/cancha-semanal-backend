import { randomBytes } from "crypto";

// Identificador corto para la URL pública (ej: cancha-semanal.com/e/a1b2c3d4).
// No es un UUID a propósito — mucho más cómodo de compartir por WhatsApp.
export function generarSlug(): string {
  return randomBytes(4).toString("hex");
}

// Secreto que la app guarda para poder administrar este evento particular
// (subir QR, cerrar el partido, listar confirmaciones). No hay login de
// usuario en este backend — es "quien tiene el token, administra el
// evento", ver comentario en schema.prisma.
export function generarAdminToken(): string {
  return randomBytes(24).toString("hex");
}
