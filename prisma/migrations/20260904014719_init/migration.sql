-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre_cancha" TEXT,
    "qr_url" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "admin_token" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmaciones" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "nombre_invitado" TEXT NOT NULL,
    "telefono" TEXT,
    "ip_origen" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE INDEX "confirmaciones_evento_id_idx" ON "confirmaciones"("evento_id");

-- AddForeignKey
ALTER TABLE "confirmaciones" ADD CONSTRAINT "confirmaciones_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
