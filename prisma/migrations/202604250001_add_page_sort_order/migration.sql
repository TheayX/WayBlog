ALTER TABLE "Page"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Page_sortOrder_idx" ON "Page"("sortOrder");
