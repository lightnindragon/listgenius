-- CreateTable
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobKey" TEXT NOT NULL,
    "altText" TEXT,
    "generatedFilename" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "quality" TEXT NOT NULL,
    "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalFileSize" INTEGER,
    "optimizedFileSize" INTEGER,
    "compressionRatio" DOUBLE PRECISION,
    "originalWidth" INTEGER,
    "originalHeight" INTEGER,
    "isFilenameEdited" BOOLEAN NOT NULL DEFAULT false,
    "isAltTextEdited" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "category" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadedAt" TIMESTAMP(3),
    "editHistory" TEXT,
    "format" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "upscaledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadedImage_userId_idx" ON "UploadedImage"("userId");

-- CreateIndex
CREATE INDEX "UploadedImage_createdAt_idx" ON "UploadedImage"("createdAt");

-- CreateIndex
CREATE INDEX "UploadedImage_expiresAt_idx" ON "UploadedImage"("expiresAt");

-- CreateIndex
CREATE INDEX "UploadedImage_moderationStatus_idx" ON "UploadedImage"("moderationStatus");

-- CreateIndex
CREATE INDEX "UploadedImage_category_idx" ON "UploadedImage"("category");

-- CreateIndex
CREATE INDEX "UploadedImage_tags_idx" ON "UploadedImage"("tags");

-- CreateIndex
CREATE INDEX "UploadedImage_isFavorite_idx" ON "UploadedImage"("isFavorite");

-- CreateIndex
CREATE INDEX "UploadedImage_order_idx" ON "UploadedImage"("order");

-- CreateIndex
CREATE INDEX "UploadedImage_blobKey_idx" ON "UploadedImage"("blobKey");

