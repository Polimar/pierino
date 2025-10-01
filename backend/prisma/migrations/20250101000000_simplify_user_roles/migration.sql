-- AlterEnum: Remove GEOMETRA and SECRETARY, add OPERATOR
-- Step 1: Update existing users to new roles
UPDATE "users" SET "role" = 'OPERATOR' WHERE "role" IN ('GEOMETRA', 'SECRETARY');

-- Step 2: Drop old enum and create new one
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';
DROP TYPE "Role_old";

