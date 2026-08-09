-- DropIndex
DROP INDEX "card_types_board_id_idx";

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "source_template_id" TEXT;

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_template_columns" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_done_column" BOOLEAN NOT NULL DEFAULT false,
    "is_blocked_column" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "workflow_template_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_template_card_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "workflow_template_card_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_templates_organization_id_idx" ON "workflow_templates"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_template_columns_organization_id_idx" ON "workflow_template_columns"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_template_columns_template_id_idx" ON "workflow_template_columns"("template_id");

-- CreateIndex
CREATE INDEX "workflow_template_card_types_organization_id_idx" ON "workflow_template_card_types"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_template_card_types_template_id_idx" ON "workflow_template_card_types"("template_id");

-- CreateIndex
CREATE INDEX "boards_source_template_id_idx" ON "boards"("source_template_id");

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_source_template_id_fkey" FOREIGN KEY ("source_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template_columns" ADD CONSTRAINT "workflow_template_columns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template_card_types" ADD CONSTRAINT "workflow_template_card_types_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
