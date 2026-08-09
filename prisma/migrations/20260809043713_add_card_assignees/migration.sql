-- CreateTable
CREATE TABLE "card_assignees" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT,
    "contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_assignees_organization_id_idx" ON "card_assignees"("organization_id");

-- CreateIndex
CREATE INDEX "card_assignees_card_id_idx" ON "card_assignees"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_assignees_card_id_user_id_key" ON "card_assignees"("card_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_assignees_card_id_contact_id_key" ON "card_assignees"("card_id", "contact_id");

-- AddForeignKey
ALTER TABLE "card_assignees" ADD CONSTRAINT "card_assignees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_assignees" ADD CONSTRAINT "card_assignees_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_assignees" ADD CONSTRAINT "card_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_assignees" ADD CONSTRAINT "card_assignees_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
