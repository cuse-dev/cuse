-- CreateEnum
CREATE TYPE "ComputerPlatform" AS ENUM ('MACOS', 'WINDOWS', 'LINUX', 'BROWSER');

-- CreateTable
CREATE TABLE "ComputerInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "ComputerPlatform" NOT NULL,
    "sandboxId" TEXT,
    "url" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComputerInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "computerId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComputerInstance_name_key" ON "ComputerInstance"("name");

-- CreateIndex
CREATE INDEX "Action_computerId_idx" ON "Action"("computerId");

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "ComputerInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
