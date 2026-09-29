/*
  Warnings:

  - A unique constraint covering the columns `[evento_id,telefono]` on the table `confirmaciones` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "confirmaciones_evento_id_telefono_key" ON "confirmaciones"("evento_id", "telefono");
