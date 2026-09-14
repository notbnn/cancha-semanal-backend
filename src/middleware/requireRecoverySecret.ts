import { NextFunction, Request, Response } from "express";

// Puerta de emergencia: si la app de un organizador pierde su base local
// (ej. una reinstalación borró los datos), esto permite recuperar el
// adminToken de un evento a partir de su slug, que es público (va en el
// link de WhatsApp). Por eso NO alcanza con conocer el slug — hace falta
// además esta clave secreta, que solo vive en la variable de entorno
// RECOVERY_SECRET de Render y nunca se comparte con nadie más.
export function requireRecoverySecret(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secretoConfigurado = process.env.RECOVERY_SECRET;

  if (!secretoConfigurado) {
    // Si no está configurada la variable, no dejamos pasar a nadie —
    // mejor "no disponible" que un endpoint abierto sin querer.
    return res.status(500).json({ error: "RECOVERY_SECRET no está configurado en el servidor" });
  }

  const recibido = req.header("x-recovery-secret");

  if (recibido !== secretoConfigurado) {
    return res.status(401).json({ error: "Clave de recuperación inválida" });
  }

  next();
}