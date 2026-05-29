-- Add a structured display label for OTHER bills.
ALTER TABLE "bills"
ADD COLUMN "itemLabel" TEXT;

-- Safely backfill historical auto-generated OTHER bills that can be identified
-- from legacy remarks. Unreliable manual data is intentionally left untouched.
UPDATE "bills"
SET "itemLabel" = CASE
  WHEN "remarks" ILIKE '%钥匙押金%' OR "remarks" ILIKE '%门卡押金%' THEN '钥匙押金'
  WHEN "remarks" ILIKE '%清洁费%' OR "remarks" ILIKE '%卫生费%' THEN '卫生费'
  ELSE "itemLabel"
END
WHERE "type" = 'OTHER'
  AND "itemLabel" IS NULL
  AND "remarks" IS NOT NULL
  AND (
    "remarks" ILIKE '%钥匙押金%'
    OR "remarks" ILIKE '%门卡押金%'
    OR "remarks" ILIKE '%清洁费%'
    OR "remarks" ILIKE '%卫生费%'
  );
