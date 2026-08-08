-- AlterTable
ALTER TABLE "card_types" ALTER COLUMN "board_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "card_types_board_id_name_key" ON "card_types"("board_id", "name");
