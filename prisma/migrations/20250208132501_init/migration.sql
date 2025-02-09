/*
  Warnings:

  - The values [Tweet] on the enum `CooldownType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CooldownType_new" AS ENUM ('Alliance', 'Battle', 'Ignore', 'Move');
ALTER TABLE "CoolDown" ALTER COLUMN "type" TYPE "CooldownType_new" USING ("type"::text::"CooldownType_new");
ALTER TYPE "CooldownType" RENAME TO "CooldownType_old";
ALTER TYPE "CooldownType_new" RENAME TO "CooldownType";
DROP TYPE "CooldownType_old";
COMMIT;
