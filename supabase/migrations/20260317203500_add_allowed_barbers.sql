ALTER TABLE services ADD COLUMN IF NOT EXISTS "allowed_barbers" uuid[] DEFAULT NULL;
