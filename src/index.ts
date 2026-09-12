import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { prisma } from "./lib/prisma";
import { eventosRouter } from "./routes/eventos";
import { publicEventosRouter } from "./routes/publicEventos";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});
app.get("/e/:slug", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "evento.html"));
});

// Endpoints de admin (requieren x-admin-token, ver middleware/requireAdminToken.ts)
app.use("/api/eventos", eventosRouter);
// Endpoints públicos — sin auth, es lo que ve el invitado desde el link (§04)
app.use("/api/public/eventos", publicEventosRouter);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
