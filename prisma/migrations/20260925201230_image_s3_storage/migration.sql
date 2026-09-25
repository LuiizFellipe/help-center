-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('LOCAL', 'S3');

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "objectKey" TEXT,
ADD COLUMN     "storage" "StorageType" NOT NULL DEFAULT 'LOCAL';
