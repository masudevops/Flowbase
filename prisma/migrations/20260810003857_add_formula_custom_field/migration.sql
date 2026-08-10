-- AlterEnum
ALTER TYPE "CustomFieldType" ADD VALUE 'FORMULA';

-- AlterTable
ALTER TABLE "custom_field_definitions" ADD COLUMN     "formula" JSONB;
