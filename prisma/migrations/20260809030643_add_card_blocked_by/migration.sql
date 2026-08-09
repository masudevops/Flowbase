-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "blocked_by_card_id" TEXT;

-- CreateIndex
CREATE INDEX "cards_blocked_by_card_id_idx" ON "cards"("blocked_by_card_id");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_blocked_by_card_id_fkey" FOREIGN KEY ("blocked_by_card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
