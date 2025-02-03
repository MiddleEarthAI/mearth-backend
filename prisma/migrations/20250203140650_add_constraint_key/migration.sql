/*
  Warnings:

  - A unique constraint covering the columns `[x,y]` on the table `MapTile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MapTile_x_y_key" ON "MapTile"("x", "y");
