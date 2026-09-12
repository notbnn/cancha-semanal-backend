-- Agrega hora_fin a eventos: hora de fin del partido en formato "HH:mm",
-- solo informativa para la pagina publica (la hora de inicio ya vive en
-- la columna fecha, que incluye fecha+hora).
ALTER TABLE "eventos" ADD COLUMN "hora_fin" TEXT;