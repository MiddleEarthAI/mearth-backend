/*
  Warnings:

  - You are about to drop the column `fieldType` on the `Location` table. All the data in the column will be lost.
  - Added the required column `terrainType` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TerrainType" AS ENUM ('Plain', 'Mountain', 'River');

-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('Active', 'Pending', 'Broken');

-- AlterTable
ALTER TABLE "Alliance" ADD COLUMN     "status" "AllianceStatus" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "fieldType",
ADD COLUMN     "terrainType" "TerrainType" NOT NULL;

-- DropEnum
DROP TYPE "FieldType";
