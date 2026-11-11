import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { prisma } from "./lib/prisma";
import { eventosRouter } from "./routes/eventos";
import { publicEventosRouter } from "./routes/publicEventos";
import { recuperarRouter } from "./routes/recuperar";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Sirve los archivos sueltos de public/ (como confirmado.mp3) por HTTP
// directo — sin esto, cualquier archivo ahí adentro que no sea
// evento.html (que se manda a mano más abajo) le da 404 al navegador,
// aunque exista en el disco del servidor.
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});
app.get("/e/:slug", (_req, res) => {
  // Sin esto, el celular (sobre todo el navegador interno de WhatsApp)
  // puede quedarse con una copia vieja guardada de esta página y no
  // pedirle al servidor la versión nueva, aunque ya la hayamos deployado.
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "..", "public", "evento.html"));
});

// Endpoints de admin (requieren x-admin-token, ver middleware/requireAdminToken.ts)
app.use("/api/eventos", eventosRouter);
// Endpoints públicos — sin auth, es lo que ve el invitado desde el link (§04)
app.use("/api/public/eventos", publicEventosRouter);
app.use("/api/recuperar", recuperarRouter);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
