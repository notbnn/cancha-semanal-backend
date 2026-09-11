# Cancha Semanal — Backend

Microservicio Node/Express/TypeScript + PostgreSQL (Prisma). Sirve el link
público que reciben los invitados por WhatsApp.

## Setup

```bash
npm install
cp .env.example .env   # completar DATABASE_URL con tu Postgres local o de Vercel/Neon
npx prisma migrate dev --name init
npm run dev
```

`npx prisma migrate dev --name init` crea la migración inicial a partir de
`prisma/schema.prisma` (tablas `eventos` y `confirmaciones`, ver §03 del
documento de arquitectura) y la aplica contra `DATABASE_URL`.

`GET /health` confirma que el server está arriba y la conexión a Postgres
funciona.

## Endpoints (Paso 2, §04)

Todos devuelven y reciben JSON.

### Admin — requieren el header `x-admin-token`

Ese token lo devuelve **una sola vez** `POST /api/eventos` al crear el
evento. La app lo tiene que guardar (secure storage); no hay forma de
recuperarlo después si se pierde.

- **`POST /api/eventos`** — crea un evento.
  Body: `{ "fecha": "2026-09-10T20:00:00Z", "nombreCancha"?: string }`.
  Devuelve el evento completo, incluido `adminToken`.
- **`POST /api/eventos/:id/qr`** — guarda la URL del QR de pago.
  Body: `{ "qrUrl": "https://..." }`. El backend no sube la imagen — hay
  que subirla a algún hosting aparte primero y mandar acá el link.
- **`GET /api/eventos/:id/confirmaciones`** — lista las confirmaciones del
  evento, para que la app las sincronice (UPSERT local por `id`/`uuid`).
- **`PATCH /api/eventos/:id`** — actualiza `estado` (`"abierto"` /
  `"cerrado"`), `nombreCancha` y/o `fecha`. Se usa sobre todo para cerrar
  el partido.

### Públicos — sin auth, es lo que ve el invitado

- **`GET /api/public/eventos/:slug`** — detalle del evento (fecha, cancha,
  QR, estado). Nunca incluye `adminToken`.
- **`POST /api/public/eventos/:slug/confirmar`** — el invitado confirma
  que va. Body: `{ "nombreInvitado": string, "telefono"?: string }`.
  Rechaza con 409 si el evento ya está `"cerrado"`.

## Qué falta

- Storage real para el QR (hoy `POST /:id/qr` solo guarda una URL que ya
  existe en algún lado — no hay upload de archivo).
- La página web pública en sí (hoy solo está la API; falta el HTML/JS que
  el invitado ve cuando abre el link).
