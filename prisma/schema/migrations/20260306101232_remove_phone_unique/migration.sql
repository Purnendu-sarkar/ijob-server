/*
  Warnings:

  - You are about to alter the column `expectedSalaryMin` on the `job_seeker_profiles` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `expectedSalaryMax` on the `job_seeker_profiles` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "job_seeker_profiles" ALTER COLUMN "fullName" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "expectedSalaryMin" SET DATA TYPE INTEGER,
ALTER COLUMN "expectedSalaryMax" SET DATA TYPE INTEGER;
