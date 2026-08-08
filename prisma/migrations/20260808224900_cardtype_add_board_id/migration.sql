-- DropIndex
DROP INDEX "card_types_organization_id_name_key";

-- AlterTable
ALTER TABLE "card_types" ADD COLUMN     "board_id" TEXT;

-- CreateIndex
CREATE INDEX "card_types_board_id_idx" ON "card_types"("board_id");

-- AddForeignKey
ALTER TABLE "card_types" ADD CONSTRAINT "card_types_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
